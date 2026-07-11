export default function HeaderControl({ query, generation, onQueryChange, onGenerationChange }) {
  return (
    <header className="tree-header-control">
      <a className="header-logo" href="/" aria-label="Riverra home">
        <span className="logo-title">RIVERRA</span>
        <span className="logo-sub">Family archive</span>
      </a>
      <div className="search-box">
        <label className="search-field">
          <span className="sr-only">Search a family member</span>
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search name or occupation" />
        </label>
        <select value={generation} onChange={(event) => onGenerationChange(event.target.value)} aria-label="Filter by generation">
          <option value="all">All generations</option>
          <option value="1">Generation 1</option>
          <option value="2">Generation 2</option>
          <option value="3">Generation 3</option>
          <option value="4">Generation 4</option>
          <option value="5">Generation 5</option>
        </select>
      </div>
    </header>
  );
}
