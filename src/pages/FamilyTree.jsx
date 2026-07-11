import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import HeaderControl from "../components/HeaderControl";
import SidebarProfile from "../components/SidebarProfile";
import "../css/family-tree.css";

const API = "https://riverra-backend.vercel.app/api/members";
const ROOT = "__riverra_root__";
const founders = new Set(["hernandes", "charleta"]);
const nameOf = (member) =>
  String(member.first_name || "")
    .trim()
    .toLowerCase();
const photo =
  "https://i.pinimg.com/736x/1c/65/35/1c6535e7f3f22e308427055cca5ed790.jpg";
const compactName = (member) => {
  const parts = `${member.first_name || ""} ${member.last_name || ""}`
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts
    .slice(1, -1)
    .map((part) => `${part[0]}.`)
    .join(" ")} ${parts.at(-1)}`;
};

function makeUnits(members) {
  const byId = new Map(members.map((member) => [String(member.id), member]));
  const candidates = new Map();
  const addCandidate = (left, right, weight = 1) => {
    if (!candidates.has(left)) candidates.set(left, new Map());
    candidates
      .get(left)
      .set(right, (candidates.get(left).get(right) || 0) + weight);
  };
  members.forEach((child) => {
    const father = String(child.father_id || ""),
      mother = String(child.mother_id || "");
    if (byId.has(father) && byId.has(mother) && father !== mother) {
      addCandidate(father, mother);
      addCandidate(mother, father);
    }
  });
  members.forEach((member) => {
    const partnerId =
      member.spouse_id ||
      member.partner_id ||
      member.spouse?.id ||
      member.partner?.id;
    if (partnerId && byId.has(String(partnerId))) {
      addCandidate(String(member.id), String(partnerId), 1000);
      addCandidate(String(partnerId), String(member.id), 1000);
    }
  });
  const h = members.find((member) => nameOf(member) === "hernandes"),
    c = members.find((member) => nameOf(member) === "charleta");
  if (h && c) {
    addCandidate(String(h.id), String(c.id), 10000);
    addCandidate(String(c.id), String(h.id), 10000);
  }
  const bestPartner = (id) =>
    [...(candidates.get(id) || [])].sort(
      ([leftId, leftScore], [rightId, rightScore]) =>
        rightScore - leftScore || leftId.localeCompare(rightId)
    )[0]?.[0];
  const used = new Set(),
    unitOf = new Map(),
    units = [];
  members.forEach((member) => {
    const id = String(member.id);
    if (used.has(id)) return;
    const partner = byId.get(bestPartner(id));
    const people =
      partner &&
      bestPartner(String(partner.id)) === id &&
      !used.has(String(partner.id))
        ? [member, partner]
        : [member];
    people.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const unit = {
      id: `family_${people.map((person) => person.id).join("_")}`,
      members: people,
    };
    people.forEach((person) => {
      used.add(String(person.id));
      unitOf.set(String(person.id), unit.id);
    });
    units.push(unit);
  });
  const founderUnit = units.find((unit) =>
    unit.members.some((member) => founders.has(nameOf(member)))
  )?.id;
  const generationOf = new Map(
    units.map((unit) => [
      unit.id,
      Math.min(
        ...unit.members.map((member) => Number(member.generation) || Infinity)
      ),
    ])
  );
  return units.map((unit) => {
    const childGeneration = generationOf.get(unit.id);
    const parent = unit.members
      .flatMap((member) => [member.father_id, member.mother_id])
      .map((id) => unitOf.get(String(id)))
      .filter((id) => id && id !== unit.id)
      .sort(
        (left, right) =>
          (generationOf.get(right) || 0) - (generationOf.get(left) || 0)
      )
      .find(
        (id) =>
          !Number.isFinite(childGeneration) ||
          !Number.isFinite(generationOf.get(id)) ||
          generationOf.get(id) < childGeneration
      );
    return {
      ...unit,
      parent: unit.id === founderUnit ? ROOT : parent || founderUnit || ROOT,
    };
  });
}

export default function FamilyTree() {
  const svgRef = useRef(null),
    [members, setMembers] = useState([]),
    [selected, setSelected] = useState(null);
  const [query, setQuery] = useState(""),
    [generation, setGeneration] = useState("all"),
    [status, setStatus] = useState("loading");
  const generations = new Set(
    members.map((member) => member.generation).filter(Boolean)
  ).size;
  const couples = new Set(
    members
      .map((member) =>
        [member.father_id, member.mother_id].filter(Boolean).sort().join("-")
      )
      .filter(Boolean)
  ).size;
  useEffect(() => {
    let live = true;
    fetch(API)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw Error();
        if (live) {
          setMembers(json.data);
          setStatus("ready");
        }
      })
      .catch(() => live && setStatus("error"));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!members.length || !svgRef.current) return;
    const term = query.toLowerCase().trim();
    const shown = members.filter(
      (member) =>
        founders.has(nameOf(member)) ||
        ((!term ||
          `${member.first_name || ""} ${member.last_name || ""} ${
            member.occupation || ""
          }`
            .toLowerCase()
            .includes(term)) &&
          (generation === "all" || String(member.generation) === generation))
    );
    const units = makeUnits(shown),
      svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!units.length) return;
    const root = d3
      .stratify()
      .id((unit) => unit.id)
      .parentId((unit) => (unit.id === ROOT ? null : unit.parent))([
      { id: ROOT, virtual: true },
      ...units,
    ]);
    d3.tree().nodeSize([480, 180])(root);
    const nodes = root.descendants().filter((node) => !node.data.virtual),
      box = svgRef.current.getBoundingClientRect();
    const minX = d3.min(nodes, (node) => node.x) ?? 0,
      maxX = d3.max(nodes, (node) => node.x) ?? 0,
      maxY = d3.max(nodes, (node) => node.y) ?? 0;
    const scale = Math.min(
      0.9,
      Math.max(
        0.3,
        Math.min(
          (box.width - 50) / Math.max(470, maxX - minX + 470),
          (box.height - 65) / Math.max(180, maxY + 150)
        )
      )
    );
    const canvas = svg.append("g"),
      transform = d3.zoomIdentity
        .translate(box.width / 2 - ((minX + maxX) / 2) * scale, 42)
        .scale(scale);
    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 2.5])
      .on("zoom", (event) => canvas.attr("transform", event.transform));
    svg.call(zoom).call(zoom.transform, transform);
    canvas
      .selectAll(".tree-link")
      .data(
        root
          .links()
          .filter(
            (link) => !link.target.data.virtual && !link.source.data.virtual
          )
      )
      .join("path")
      .attr("class", "tree-link")
      .attr("d", (link) => {
        const from = link.source.y + 34,
          to = link.target.y - 34,
          mid = from + (to - from) / 2;
        return `M${link.source.x},${from}V${mid}H${link.target.x}V${to}`;
      });
    const groups = canvas
      .selectAll(".family-unit")
      .data(nodes)
      .join("g")
      .attr("class", "family-unit")
      .attr("transform", (node) => `translate(${node.x},${node.y})`);
    groups
      .filter((node) => node.data.members.length === 2)
      .append("path")
      .attr("class", "couple-link")
      .attr("d", "M-12,0H12");
    const cards = groups
      .selectAll(".tree-node")
      .data((node) =>
        node.data.members.map((member, index, list) => ({
          member,
          offset: list.length === 2 ? (index ? 118 : -118) : 0,
        }))
      )
      .join("g")
      .attr("class", "tree-node")
      .attr("transform", (item) => `translate(${item.offset},0)`)
      .attr("tabindex", 0)
      .on("click", (_, item) => setSelected(item.member))
      .on("keydown", (event, item) => {
        if (event.key === "Enter" || event.key === " ")
          setSelected(item.member);
      });
    cards
      .append("rect")
      .attr("class", "node-card")
      .attr("x", -105)
      .attr("y", -33)
      .attr("width", 210)
      .attr("height", 66)
      .attr("rx", 12);
    cards
      .append("image")
      .attr("x", -93)
      .attr("y", -21)
      .attr("width", 42)
      .attr("height", 42)
      .attr("href", (item) => item.member.photo || photo)
      .attr("preserveAspectRatio", "xMidYMid slice");
    cards
      .append("text")
      .attr("class", "node-name")
      .attr("x", -39)
      .attr("y", -4)
      .text((item) => compactName(item.member));
    cards
      .append("text")
      .attr("class", "node-meta")
      .attr("x", -39)
      .attr("y", 15)
      .text((item) => `Generation ${item.member.generation || "-"}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, query, generation]);
  return (
    <section className="family-tree-page">
      <section className="tree-statistics">
        <div className="tree-stat-card">
          <strong>{members.length}</strong>
          <span>Members</span>
        </div>
        <div className="tree-stat-card">
          <strong>{generations}</strong>
          <span>Generations</span>
        </div>
        <div className="tree-stat-card">
          <strong>1</strong>
          <span>Founders</span>
        </div>
        <div className="tree-stat-card">
          <strong>{couples}</strong>
          <span>Couples</span>
        </div>
      </section>
      <HeaderControl
        query={query}
        generation={generation}
        onQueryChange={setQuery}
        onGenerationChange={setGeneration}
      />
      <main className="tree-workspace">
        <div className="tree-panel">
          <div className="tree-canvas">
            <svg ref={svgRef} aria-label="Interactive family tree" />
            {status === "loading" && (
              <div className="tree-message">Loading family archive...</div>
            )}
            {status === "error" && (
              <div className="tree-message tree-message--error">
                Family archive could not be loaded.
              </div>
            )}
          </div>
          <p className="tree-hint">
            Drag to explore · Scroll to zoom · Select a member for details
          </p>
        </div>
        <SidebarProfile member={selected} />
      </main>
    </section>
  );
}
