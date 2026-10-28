/* RESIDENT — легкий рендерер сторінок (заміна середовища редактора дизайну).
   Шаблон сторінки лежить у <script type="text/x-dc-template">, логіка — у <script type="text/x-dc">.
   Потрібен Idiomorph (assets/idiomorph.min.js), підключений перед цим файлом. */
(function () {
  'use strict';

  class DCLogic {
    constructor() { this.state = {}; this.props = {}; }
    setState(patch) {
      this.state = Object.assign({}, this.state, typeof patch === 'function' ? patch(this.state) : patch);
      scheduleRender();
    }
  }
  window.DCLogic = DCLogic;

  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const ONLY = /^\{\{\s*([^}]+?)\s*\}\}$/;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let instance = null, tpl = null, root = null, REG = [], pending = false;

  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    const parts = expr.split('.');
    let v;
    for (let i = scope.length - 1; i >= 0; i--) {
      if (scope[i] && Object.prototype.hasOwnProperty.call(scope[i], parts[0])) { v = scope[i][parts[0]]; break; }
    }
    for (let i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
    return v;
  }
  const interp = (str, scope) => str.replace(HOLE, (_, e) => { const v = lookup(e, scope); return v == null ? '' : String(v); });
  const reg = (fn) => { REG.push(fn); return REG.length - 1; };

  function renderChildren(node, scope) {
    let out = '';
    node.childNodes.forEach((c) => { out += renderNode(c, scope); });
    return out;
  }

  function renderNode(node, scope) {
    if (node.nodeType === 3) return esc(interp(node.nodeValue, scope));
    if (node.nodeType !== 1) return '';
    const tag = node.localName;
    if (tag === 'sc-for') {
      const list = lookup((node.getAttribute('list') || '').replace(/^\{\{|\}\}$/g, ''), scope) || [];
      const as = node.getAttribute('as') || 'item';
      let out = '';
      list.forEach((item, i) => { out += renderChildren(node, scope.concat([{ [as]: item, index: i }])); });
      return out;
    }
    if (tag === 'sc-if') {
      const v = lookup((node.getAttribute('value') || '').replace(/^\{\{|\}\}$/g, ''), scope);
      return v ? renderChildren(node, scope) : '';
    }
    let attrs = '';
    for (const a of Array.from(node.attributes)) {
      const name = a.name, val = a.value, m = val.match(ONLY);
      if (name.startsWith('hint-')) continue;
      if (/^on[a-z]+$/i.test(name) && m) {
        const fn = lookup(m[1], scope);
        if (typeof fn === 'function') attrs += ` data-dc-e-${name.slice(2).toLowerCase()}="${reg(fn)}"`;
        continue;
      }
      if (name === 'ref' && m) {
        const fn = lookup(m[1], scope);
        if (typeof fn === 'function') attrs += ` data-dc-ref="${reg(fn)}"`;
        continue;
      }
      if (m) {
        const v = lookup(m[1], scope);
        if (name === 'value') { attrs += ` value="${esc(v == null ? '' : v)}" data-dc-value="${esc(v == null ? '' : v)}"`; continue; }
        if (name === 'checked') { if (v) attrs += ' checked'; attrs += ` data-dc-checked="${v ? 1 : 0}"`; continue; }
        if (v === true) { attrs += ` ${name}`; continue; }
        if (v === false || v == null) continue;
        attrs += ` ${name}="${esc(v)}"`;
        continue;
      }
      attrs += ` ${name}="${esc(interp(val, scope))}"`;
    }
    if (VOID.has(tag)) return `<${tag}${attrs}>`;
    return `<${tag}${attrs}>${renderChildren(node, scope)}</${tag}>`;
  }

  const TEXTY = /^(text|number|tel|email|search|password|url)$/;
  function eventType(el, t) {
    if (t === 'change' && ((el.tagName === 'INPUT' && TEXTY.test(el.type || 'text')) || el.tagName === 'TEXTAREA')) return 'input';
    if (t === 'doubleclick') return 'dblclick';
    return t;
  }

  function wire() {
    root.querySelectorAll('*').forEach((el) => {
      for (const a of Array.from(el.attributes)) {
        if (!a.name.startsWith('data-dc-e-')) continue;
        const t = a.name.slice(10);
        el.__dcb = el.__dcb || {};
        if (el.__dcb[t]) continue;
        el.__dcb[t] = true;
        el.addEventListener(eventType(el, t), (ev) => {
          const f = REG[Number(el.getAttribute('data-dc-e-' + t))];
          if (f) f(ev);
        });
      }
    });
    root.querySelectorAll('[data-dc-value]').forEach((el) => {
      if (document.activeElement !== el && el.value !== el.getAttribute('data-dc-value')) el.value = el.getAttribute('data-dc-value');
    });
    root.querySelectorAll('[data-dc-checked]').forEach((el) => { el.checked = el.getAttribute('data-dc-checked') === '1'; });
    root.querySelectorAll('[data-dc-ref]').forEach((el) => {
      const f = REG[Number(el.getAttribute('data-dc-ref'))];
      if (f) f(el);
    });
  }

  function render() {
    pending = false;
    REG = [];
    let vals = {};
    try { vals = instance.renderVals() || {}; } catch (e) { console.error(e); }
    const html = renderChildren(tpl.content, [vals]);
    if (!root.__dcInit) {
      root.innerHTML = html;
      root.__dcInit = true;
    } else {
      window.Idiomorph.morph(root, html, {
        morphStyle: 'innerHTML',
        ignoreActiveValue: true,
        callbacks: {
          beforeAttributeUpdated: (attr, el) => !(attr === 'style' && el.hasAttribute && el.hasAttribute('data-keep-style'))
        }
      });
    }
    wire();
  }
  function scheduleRender() {
    if (pending || !instance) return;
    pending = true;
    Promise.resolve().then(render);
  }

  function boot() {
    const t = document.getElementById('dc-template');
    const s = document.querySelector('script[type="text/x-dc"]');
    root = document.getElementById('dc-root');
    if (!t || !s || !root) return;
    tpl = document.createElement('template');
    tpl.innerHTML = t.textContent;
    const Component = new Function('DCLogic', s.textContent + '\n;return Component;')(DCLogic);
    instance = new Component();
    instance.state = instance.state || {};
    instance.props = instance.props || {};
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
