export default function Heading({ eyebrow, title, text, children }) {
  return <div className="page-heading">
    <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div>
    {children}
  </div>
}
