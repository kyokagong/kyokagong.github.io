/* ================================================================
   TTS Player - 浮动语音朗读播放器
   章节级朗读 + 段落级进度缓存(localStorage)
   零依赖,纯原生 Web Speech API
   ================================================================ */

(function () {
  'use strict';

  // ---- 能力检测 ----
  if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
    console.warn('[TTS] 当前浏览器不支持 Web Speech API,语音功能已禁用');
    return;
  }

  // ---- 常量 ----
  // 自动从 URL 识别当前书 slug,使进度数据按书隔离
  const BOOK_SLUG = (location.pathname.match(/\/books\/([a-z0-9-]+)\//) || [])[1] || 'default';
  const STORAGE_KEY = `${BOOK_SLUG}.tts.progress.v1`;
  const SEGMENT_SELECTOR = 'main p, main h2, main h3, main h4, main li, main blockquote, article p, article h2, article h3, article li';
  const CHARS_PER_SECOND_BASE = 4.5;  // 中文朗读基线字符/秒(用于段进度估算)
  const SAVE_DEBOUNCE_MS = 3000;

  // ---- 状态 ----
  const DEFAULT_STATE = {
    version: 1,
    currentChapter: null,
    lastPlayAt: 0,
    chapters: {},
    settings: {
      defaultRate: 1.0,
      defaultVoiceURI: 'auto',
      autoScroll: true,
      playerPosition: null  // {x, y} 拖拽后的位置
    }
  };

  let state = loadState();
  const synth = window.speechSynthesis;
  let segments = [];           // 段元素数组
  let currentIdx = -1;         // 当前朗读段 (-1 = 未开始)
  let chapterId = getChapterId();
  let queueChunks = [];        // 当前段的 chunks
  let isSpeaking = false;
  let isPaused = false;
  let voicesList = [];
  let saveTimer = null;
  let utterance = null;        // 当前 SpeechSynthesisUtterance
  let chunkStartedAt = 0;      // 当前 chunk 开始时间(ms)
  let chunkText = '';          // 当前 chunk 文本(用于估算进度)

  // ---- localStorage 读写 ----
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefault();
      const parsed = JSON.parse(raw);
      // 浅合并默认字段,保证版本兼容
      return Object.assign(cloneDefault(), parsed, {
        settings: Object.assign({}, DEFAULT_STATE.settings, parsed.settings || {}),
        chapters: parsed.chapters || {}
      });
    } catch (e) {
      console.warn('[TTS] 读取进度失败,使用默认:', e);
      return cloneDefault();
    }
  }
  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  function saveProgress() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('[TTS] localStorage 写入失败:', e);
      }
      saveTimer = null;
    }, SAVE_DEBOUNCE_MS);
  }
  function flushProgress() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* 配额或隐私模式 */ }
  }

  // ---- 章 ID 推导 ----
  function getChapterId() {
    const m = location.pathname.match(/\/chapters\/(ch\d+-[a-z0-9-]+)\.html/i);
    return m ? m[1] : null;
  }

  // ---- 文本清洗 ----
  function cleanText(raw) {
    if (!raw) return '';
    return raw
      .replace(/```[\s\S]*?```/g, ' ')            // 代码块
      .replace(/`[^`]+`/g, ' ')                   // inline code
      .replace(/\$\$[\s\S]*?\$\$/g, ' ')          // 公式块
      .replace(/\$[^$]+\$/g, ' ')                 // 行内公式
      .replace(/<[^>]+>/g, ' ')                   // 残留标签
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')    // 链接
      .replace(/[#*_~>]+/g, ' ')                  // markdown 标记
      .replace(/^[\s>│├└─]+/gm, '')               // 引用/列表前缀
      .replace(/\s+/g, ' ')                       // 空白合一
      .replace(/[「」『』《》]/g, m =>              // 中文引号转双引号
        ({ '「': '“', '」': '”', '『': '‘', '』': '’', '《': '“', '》': '”' })[m] || m)
      .trim();
  }

  // ---- 长段切分(按句号,避免长文本截断) ----
  function splitLongText(text, maxLen = 180) {
    if (!text) return [];
    const sentences = text.match(/[^。！？.!?\n]+[。！？.!?\n]?/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      const candidate = current + s;
      if (candidate.length > maxLen && current) {
        chunks.push(current.trim());
        current = s;
      } else {
        current = candidate;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.filter(Boolean);
  }

  // ---- 段选择(在 main / article 内) ----
  function collectSegments() {
    const root = document.querySelector('main') || document.querySelector('article') || document.body;
    const nodes = Array.from(root.querySelectorAll(SEGMENT_SELECTOR));
    const seen = new Set();
    const result = [];
    for (const el of nodes) {
      // 排除:代码块 / 表格 / SVG / 公式 / 显式 no-tts
      if (el.closest('pre, code, table, svg, .no-tts, .tts-player, .tts-toast, script, style')) continue;
      if (el.children.length > 0) continue;        // 只取叶子段
      const text = cleanText(el.textContent);
      if (!text || text.length < 2) continue;
      // 去重(同一段文本多次出现时只取第一次)
      const sig = text.slice(0, 80);
      if (seen.has(sig)) continue;
      seen.add(sig);
      el.dataset.ttsIdx = String(result.length);
      result.push({ el, text });
    }
    return result;
  }

  // ---- 章进度 getter / setter ----
  function getChapterProgress() {
    if (!chapterId) return null;
    if (!state.chapters[chapterId]) {
      state.chapters[chapterId] = {
        playedSegments: 0,
        currentSegment: 0,
        rate: state.settings.defaultRate,
        voiceURI: state.settings.defaultVoiceURI
      };
    }
    return state.chapters[chapterId];
  }

  // ---- UI 注入 ----
  function injectUI() {
    if (document.getElementById('tts-player')) return;
    const html = `
<div id="tts-player" class="tts-player tts-player--collapsed">
  <button class="tts-player__toggle" type="button" aria-label="打开语音朗读" title="语音朗读">🔊</button>
  <div class="tts-player__panel" role="dialog" aria-label="语音朗读播放器">
    <div class="tts-player__header">
      <span class="tts-player__title">🔊 语音朗读</span>
      <span class="tts-player__chapter" data-role="chapter">未开始</span>
      <button class="tts-player__close" type="button" aria-label="收起播放器" title="收起">×</button>
    </div>
    <div class="tts-player__main">
      <button class="tts-player__btn tts-player__btn--prev" type="button" aria-label="上一段" title="上一段">⏮</button>
      <button class="tts-player__btn tts-player__btn--play" type="button" aria-label="播放/暂停" title="播放/暂停">▶</button>
      <button class="tts-player__btn tts-player__btn--next" type="button" aria-label="下一段" title="下一段">⏭</button>
      <div class="tts-player__progress" data-role="progress-track">
        <div class="tts-player__progress-bar" data-role="progress-bar"></div>
      </div>
    </div>
    <div class="tts-player__progress-text" data-role="progress-text">0 / ${segments.length}</div>
    <div class="tts-player__settings">
      <label>语速
        <input type="range" min="0.5" max="2.0" step="0.1" data-role="rate" value="1.0">
        <span class="tts-rate-val" data-role="rate-val">1.0×</span>
      </label>
      <label>语音
        <select data-role="voice"></select>
      </label>
      <label>
        <input type="checkbox" data-role="autoscroll" checked>
        自动滚动到当前段
      </label>
    </div>
  </div>
</div>
    `.trim();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstElementChild);

    // 绑定事件
    const $ = (sel) => document.querySelector(`#tts-player ${sel}`);
    const player = document.getElementById('tts-player');
    const toggleBtn = player.querySelector('.tts-player__toggle');
    const closeBtn = player.querySelector('.tts-player__close');
    const playBtn = player.querySelector('.tts-player__btn--play');
    const prevBtn = player.querySelector('.tts-player__btn--prev');
    const nextBtn = player.querySelector('.tts-player__btn--next');
    const rateInput = player.querySelector('[data-role="rate"]');
    const rateVal = player.querySelector('[data-role="rate-val"]');
    const voiceSelect = player.querySelector('[data-role="voice"]');
    const autoscrollCheckbox = player.querySelector('[data-role="autoscroll"]');
    const progressTrack = player.querySelector('[data-role="progress-track"]');
    const progressBar = player.querySelector('[data-role="progress-bar"]');
    const progressText = player.querySelector('[data-role="progress-text"]');
    const chapterLabel = player.querySelector('[data-role="chapter"]');

    // 展开/折叠
    toggleBtn.addEventListener('click', () => {
      player.classList.remove('tts-player--collapsed');
      player.classList.add('tts-player--expanded');
      positionPlayer();
    });
    closeBtn.addEventListener('click', () => {
      player.classList.remove('tts-player--expanded');
      player.classList.add('tts-player--collapsed');
    });

    // 拖拽
    makeDraggable(player, player.querySelector('.tts-player__header'));

    // 播放控制
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);

    // 进度条点击
    progressTrack.addEventListener('click', (e) => {
      if (!segments.length) return;
      const rect = progressTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const target = Math.floor(ratio * segments.length);
      playFromSegment(target);
    });

    // 语速
    const cp = getChapterProgress();
    if (cp) {
      rateInput.value = String(cp.rate || 1.0);
      rateVal.textContent = (cp.rate || 1.0).toFixed(1) + '×';
    } else {
      rateInput.value = String(state.settings.defaultRate);
      rateVal.textContent = state.settings.defaultRate.toFixed(1) + '×';
    }
    rateInput.addEventListener('input', () => {
      const v = parseFloat(rateInput.value);
      rateVal.textContent = v.toFixed(1) + '×';
      const c = getChapterProgress();
      if (c) c.rate = v;
      state.settings.defaultRate = v;
      saveProgress();
    });

    // 语音下拉
    populateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = populateVoices;
    }

    // 自动滚动
    autoscrollCheckbox.checked = state.settings.autoScroll;
    autoscrollCheckbox.addEventListener('change', () => {
      state.settings.autoScroll = autoscrollCheckbox.checked;
      saveProgress();
    });

    // 恢复位置
    if (state.settings.playerPosition) {
      applyPlayerPosition(player, state.settings.playerPosition);
    }

    // 章信息
    chapterLabel.textContent = chapterId ? formatChapterLabel(chapterId) : '本书通用';
    progressText.textContent = segments.length
      ? `0 / ${segments.length}`
      : '本页无可朗读内容';

    // 暴露给外部(可选)
    window.__TTS__ = {
      play: () => playFromSegment(Math.max(0, currentIdx)),
      stop: stop,
      toggle: togglePlay,
      jump: playFromSegment,
      getState: () => state
    };
  }

  function formatChapterLabel(id) {
    // "ch15-crewai-virtual-teams" → "ch15 · crewai"
    const m = id.match(/^(ch\d+)-([a-z0-9-]+)/i);
    if (!m) return id;
    const title = m[2].split('-').slice(0, 2).join(' ');
    return `${m[1]} · ${title}`;
  }

  function applyPlayerPosition(player, pos) {
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return;
    player.style.left = pos.x + 'px';
    player.style.top = pos.y + 'px';
    player.style.right = 'auto';
    player.style.bottom = 'auto';
  }

  function positionPlayer() {
    const player = document.getElementById('tts-player');
    if (!player) return;
    if (state.settings.playerPosition) {
      applyPlayerPosition(player, state.settings.playerPosition);
    }
  }

  function makeDraggable(player, handle) {
    let startX = 0, startY = 0, origX = 0, origY = 0, dragging = false;
    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      const rect = player.getBoundingClientRect();
      origX = rect.left; origY = rect.top;
      startX = e.clientX; startY = e.clientY;
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = Math.max(0, Math.min(window.innerWidth - 100, origX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, origY + dy));
      player.style.left = newX + 'px';
      player.style.top = newY + 'px';
      player.style.right = 'auto';
      player.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      const rect = player.getBoundingClientRect();
      state.settings.playerPosition = { x: rect.left, y: rect.top };
      saveProgress();
    });
    // 触屏拖拽
    handle.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      const t = e.touches[0];
      dragging = true;
      const rect = player.getBoundingClientRect();
      origX = rect.left; origY = rect.top;
      startX = t.clientX; startY = t.clientY;
    }, { passive: true });
    handle.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const newX = Math.max(0, Math.min(window.innerWidth - 100, origX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, origY + dy));
      player.style.left = newX + 'px';
      player.style.top = newY + 'px';
    }, { passive: true });
    handle.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      const rect = player.getBoundingClientRect();
      state.settings.playerPosition = { x: rect.left, y: rect.top };
      saveProgress();
    });
  }

  // ---- 语音包 ----
  function populateVoices() {
    voicesList = synth.getVoices() || [];
    const select = document.querySelector('#tts-player [data-role="voice"]');
    if (!select) return;
    // 优先列出中文语音
    const zhVoices = voicesList.filter(v => /^(zh|cmn)/i.test(v.lang));
    const others = voicesList.filter(v => !/^(zh|cmn)/i.test(v.lang));
    const sorted = [...zhVoices, ...others];
    if (sorted.length === 0) {
      select.innerHTML = '<option value="">(无可用语音)</option>';
      return;
    }
    select.innerHTML = sorted
      .map((v, i) => `<option value="${escapeAttr(v.voiceURI)}">${escapeHtml(v.name)} (${v.lang})</option>`)
      .join('');
    const cp = getChapterProgress();
    const want = (cp && cp.voiceURI) || state.settings.defaultVoiceURI;
    if (want && want !== 'auto') {
      const hit = sorted.find(v => v.voiceURI === want);
      if (hit) select.value = hit.voiceURI;
    } else {
      // 自动:选第一个中文,否则第一个
      const first = zhVoices[0] || sorted[0];
      if (first) select.value = first.voiceURI;
    }
    select.onchange = () => {
      const c = getChapterProgress();
      if (c) c.voiceURI = select.value;
      state.settings.defaultVoiceURI = select.value;
      saveProgress();
    };
  }

  function getSelectedVoice() {
    const select = document.querySelector('#tts-player [data-role="voice"]');
    if (!select) return null;
    const uri = select.value;
    return voicesList.find(v => v.voiceURI === uri) || null;
  }

  // ---- 朗读控制 ----
  function togglePlay() {
    if (isSpeaking && !isPaused) {
      synth.pause();
      isPaused = true;
      updatePlayBtn('▶');
      return;
    }
    if (isPaused) {
      synth.resume();
      isPaused = false;
      updatePlayBtn('⏸');
      return;
    }
    if (currentIdx < 0) {
      // 从上次进度开始
      const cp = getChapterProgress();
      const start = (cp && cp.currentSegment) || 0;
      playFromSegment(Math.max(0, Math.min(start, segments.length - 1)));
    } else {
      playFromSegment(currentIdx);
    }
  }

  function updatePlayBtn(icon) {
    const btn = document.querySelector('#tts-player .tts-player__btn--play');
    if (btn) btn.textContent = icon;
    const toggle = document.querySelector('#tts-player .tts-player__toggle');
    if (toggle) toggle.classList.toggle('is-playing', icon === '⏸');
  }

  function playPrev() {
    if (currentIdx <= 0) return;
    playFromSegment(currentIdx - 1);
  }

  function playNext() {
    if (currentIdx >= segments.length - 1) {
      stop();
      showToast('本章朗读完成 ✓', null, 2500);
      return;
    }
    playFromSegment(currentIdx + 1);
  }

  function stop() {
    synth.cancel();
    isSpeaking = false;
    isPaused = false;
    currentIdx = -1;
    queueChunks = [];
    utterance = null;
    updatePlayBtn('▶');
    updateProgress(0);
  }

  function playFromSegment(idx) {
    if (!segments.length) {
      showToast('本页没有可朗读内容', null, 2500);
      return;
    }
    if (idx < 0 || idx >= segments.length) return;
    // 取消当前朗读
    synth.cancel();
    currentIdx = idx;
    isSpeaking = true;
    isPaused = false;
    updatePlayBtn('⏸');

    // 取消所有高亮
    document.querySelectorAll('.tts-current').forEach(el => {
      el.classList.remove('tts-current');
    });
    document.querySelectorAll('.tts-just-finished').forEach(el => {
      el.classList.remove('tts-just-finished');
    });

    // 高亮新段
    highlightSegment(idx);

    // 切分并朗读
    const seg = segments[idx];
    queueChunks = splitLongText(seg.text);
    state.currentChapter = chapterId;
    state.lastPlayAt = Date.now();
    const cp = getChapterProgress();
    if (cp) {
      cp.currentSegment = idx;
      cp.playedSegments = Math.max(cp.playedSegments || 0, idx);
    }
    saveProgress();

    if (queueChunks.length === 0) {
      playNext();
      return;
    }
    speakNextChunk();
  }

  function speakNextChunk() {
    if (!queueChunks.length) {
      // 当前段完成 → 下一段
      const cp = getChapterProgress();
      if (cp) cp.playedSegments = Math.max(cp.playedSegments || 0, currentIdx);
      saveProgress();
      // 1.5s 后清除高亮
      const el = segments[currentIdx] && segments[currentIdx].el;
      if (el) {
        el.classList.add('tts-just-finished');
        setTimeout(() => el.classList.remove('tts-just-finished'), 2200);
      }
      // 自动播放下一段(可选,默认开启)
      playNext();
      return;
    }
    const text = queueChunks.shift();
    chunkText = text;
    chunkStartedAt = Date.now();
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    const cp = getChapterProgress();
    utterance.rate = (cp && cp.rate) || state.settings.defaultRate || 1.0;
    const v = getSelectedVoice();
    if (v) utterance.voice = v;
    utterance.onend = () => {
      // 进度更新
      updateProgress(currentIdx + 1);
      if (queueChunks.length === 0) {
        // 段完成
        const progressText = document.querySelector('#tts-player [data-role="progress-text"]');
        if (progressText) progressText.textContent = `${currentIdx + 1} / ${segments.length}`;
      }
      // 继续下一 chunk
      if (isSpeaking && !isPaused) {
        speakNextChunk();
      }
    };
    utterance.onerror = (e) => {
      if (e.error && e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('[TTS] utterance error:', e.error);
      }
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      // 其他错误:跳过当前 chunk 继续
      if (isSpeaking && !isPaused) speakNextChunk();
    };
    synth.speak(utterance);

    // 启动段进度估算
    estimateChunkProgress(text);
  }

  function estimateChunkProgress(text) {
    const expectedMs = (text.length / (CHARS_PER_SECOND_BASE * (state.settings.defaultRate || 1))) * 1000;
    const start = Date.now();
    const bar = document.querySelector('#tts-player [data-role="progress-bar"]');
    function tick() {
      if (!isSpeaking || isPaused) return;
      const elapsed = Date.now() - start;
      const segProgress = Math.min(1, elapsed / expectedMs);
      const totalProgress = (currentIdx + segProgress) / segments.length;
      if (bar) bar.style.width = (totalProgress * 100) + '%';
      if (segProgress < 1 && isSpeaking) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function highlightSegment(idx) {
    document.querySelectorAll('.tts-current').forEach(el => el.classList.remove('tts-current'));
    const el = segments[idx] && segments[idx].el;
    if (!el) return;
    el.classList.add('tts-current');
    if (state.settings.autoScroll) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function updateProgress(currentSegmentIdx) {
    const bar = document.querySelector('#tts-player [data-role="progress-bar"]');
    const text = document.querySelector('#tts-player [data-role="progress-text"]');
    const ratio = segments.length ? currentSegmentIdx / segments.length : 0;
    if (bar) bar.style.width = (ratio * 100) + '%';
    if (text) text.textContent = `${Math.min(currentSegmentIdx, segments.length)} / ${segments.length}`;
  }

  // ---- Toast ----
  function showToast(message, actionLabel, duration) {
    const existing = document.querySelector('.tts-toast');
    if (existing) existing.remove();
    duration = duration || 5000;
    const toast = document.createElement('div');
    toast.className = 'tts-toast';
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      ${actionLabel ? `<button class="tts-toast__action">${escapeHtml(actionLabel)}</button>` : ''}
      <button class="tts-toast__close" aria-label="关闭">×</button>
    `;
    document.body.appendChild(toast);
    const close = () => toast.remove();
    toast.querySelector('.tts-toast__close').addEventListener('click', close);
    const actionBtn = toast.querySelector('.tts-toast__action');
    if (actionBtn) actionBtn.addEventListener('click', () => {
      close();
      // 章末:跳到下一章
      const nextLink = document.querySelector('a[href*="ch"]:not([href*="index"]):not([href*="agent-dev/index"])');
      // 优先找 pager 中的下一章
      const pager = document.querySelector('.chapter-pager');
      let next = null;
      if (pager) next = pager.querySelector('a[rel="next"], a:last-child');
      if (next && next.href) location.href = next.href;
    });
    setTimeout(close, duration);
  }

  // ---- 工具 ----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---- 跨 tab 同步 ----
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = Object.assign(cloneDefault(), JSON.parse(e.newValue), {
          settings: Object.assign({}, DEFAULT_STATE.settings, JSON.parse(e.newValue).settings || {})
        });
        const cp = getChapterProgress();
        const rateInput = document.querySelector('#tts-player [data-role="rate"]');
        const rateVal = document.querySelector('#tts-player [data-role="rate-val"]');
        if (rateInput && cp) {
          rateInput.value = String(cp.rate || 1.0);
          rateVal.textContent = (cp.rate || 1.0).toFixed(1) + '×';
        }
      } catch (err) { /* ignore */ }
    }
  });

  // ---- 页面生命周期 ----
  window.addEventListener('pagehide', flushProgress);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushProgress();
  });
  window.addEventListener('beforeunload', flushProgress);

  // ---- 启动 ----
  function bootstrap() {
    // 把书 slug 暴露到 <html data-book-slug="..."> 让 CSS 可用属性选择器覆盖主题色
    document.documentElement.setAttribute('data-book-slug', BOOK_SLUG);
    segments = collectSegments();
    injectUI();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
