function formatInline(text) {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : part.startsWith('`') && part.endsWith('`') ? (
        <code key={index}>{part.slice(1, -1)}</code>
      ) : (
        part
      ),
    )
}

export default function FormattedAnswer({ text }) {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  const blocks = []
  lines.forEach((line, index) => {
    const clean = line
      .replace(/^#{1,4}\s+/, '')
      .replace(/\*\*/g, '')
      .trim()
    const isMarkedHeading = /^#{1,4}\s/.test(line) || /^\*\*.+\*\*:?$/.test(line)
    const nextLine = lines[index + 1] || ''
    const isShortHeading =
      clean.length > 2 && clean.length < 58 && !/[.!?]$/.test(clean) && /:$/.test(clean)
    const isBullet = /^([-*•]|\d+[.)])\s+/.test(line)
    if (isBullet) {
      const previous = blocks[blocks.length - 1]
      if (previous?.type === 'list') previous.items.push(line.replace(/^([-*•]|\d+[.)])\s+/, ''))
      else blocks.push({ type: 'list', items: [line.replace(/^([-*•]|\d+[.)])\s+/, '')] })
    } else if (
      isMarkedHeading ||
      isShortHeading ||
      (clean.length < 46 &&
        !/[.!?]$/.test(clean) &&
        nextLine &&
        /^([-*•]|\d+[.)])\s+/.test(nextLine))
    ) {
      blocks.push({ type: 'heading', text: clean.replace(/:$/, '') })
    } else {
      const previous = blocks[blocks.length - 1]
      if (previous?.type === 'paragraph') previous.text += ` ${line}`
      else blocks.push({ type: 'paragraph', text: line })
    }
  })
  return (
    <div className="assistant-answer">
      {blocks.map((block, index) => {
        if (block.type === 'heading')
          return (
            <h3 className={`answer-heading tone-${index % 4}`} key={index}>
              {formatInline(block.text)}
            </h3>
          )
        if (block.type === 'list')
          return (
            <div className="answer-items" key={index}>
              {block.items.map((item, itemIndex) => (
                <div className="answer-item" key={itemIndex}>
                  <span aria-hidden="true">{itemIndex + 1}</span>
                  <p>{formatInline(item)}</p>
                </div>
              ))}
            </div>
          )
        return (
          <p className={`answer-paragraph tone-${index % 4}`} key={index}>
            {formatInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}
