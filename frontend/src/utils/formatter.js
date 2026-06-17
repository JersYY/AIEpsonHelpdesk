// Lightweight, safe markdown renderer for AI chat messages.
// Escapes HTML first to prevent XSS, then applies a small subset of markdown:
// **bold**, *italic* / _italic_, numbered lists, bullet lists, and line breaks.

const escapeHtml = (text = '') =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const applyInline = (text = '') =>
  text
    // bold: **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // italic: *text* or _text_
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>')

const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/
const HEADING = /^\s{0,3}#{1,6}\s+(.+)$/
const HORIZONTAL_RULE = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/
const BULLET = /^\s*[-*•]\s+(.*)$/

// Convert raw AI text into safe formatted HTML.
export const renderMessage = (raw = '') => {
  const escaped = escapeHtml(raw)
  const lines = escaped.split(/\r?\n/)

  const html = []
  let listType = null // 'ol' | 'ul' | null
  let orderedIndex = 1

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  for (const line of lines) {
    const heading = line.match(HEADING)
    const numbered = line.match(NUMBERED)
    const bullet = line.match(BULLET)

    if (HORIZONTAL_RULE.test(line)) {
      closeList()
      orderedIndex = 1
      continue
    }

    if (heading) {
      closeList()
      orderedIndex = 1
      html.push(`<p><strong>${applyInline(heading[1])}</strong></p>`)
      continue
    }

    if (numbered) {
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${applyInline(numbered[2])}</li>`)
      orderedIndex += 1
      continue
    }

    if (bullet) {
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${applyInline(bullet[1])}</li>`)
      continue
    }

    if (line.trim() === '') {
      if (!listType) html.push('<br/>')
    } else {
      closeList()
      orderedIndex = 1
      html.push(`<p>${applyInline(line)}</p>`)
    }
  }

  closeList()

  return html.join('')
}

export default { renderMessage }
