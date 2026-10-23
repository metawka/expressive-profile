import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { useState } from "react";
import { projectList, projectView } from "../render/blocks";
import type { Config, Data, Repo, SchemeName } from "../render";
import type { Dict } from "./i18n";
import { activePreset, applyPreset, PRESETS, type PresetId } from "./presets";
import { bouncy, Button, Field, Glyph, IconButton, IconSelect, ItemList, Section, Segmented, ShapePicker, spring, Switch } from "./ui";

export type SheetId = "hero" | "about" | "stack" | "projects" | "stats" | "authoredStats" | "streak" | "socials" | "buttons" | "style";

interface Props {
  c: Config;
  set: (fn: (c: Config) => Config) => void;
  t: Dict;
  d: Data;
}

// Hero
function Hero({ c, set, t }: Props) {
  const h = c.hero;
  const up = (v: Partial<Config["hero"]>) => set((c) => ({ ...c, hero: { ...c.hero, ...v } }));
  return (
    <>
      <Section>
        <Field label={t.greeting} value={h.greeting} onChange={(greeting) => up({ greeting })} maxLength={40} />
        <Field label={t.name} value={h.name} placeholder={c.login || t.namePlaceholder} onChange={(name) => up({ name })} maxLength={32} />
        <Field label={t.subtitle} value={h.subtitle} onChange={(subtitle) => up({ subtitle })} multiline maxLength={140} />
        <Switch label={t.typing} value={h.typing} onChange={(typing) => up({ typing })} />
      </Section>
      <Section title={t.avatarShape}>
        <ShapePicker value={h.avatarShape} onChange={(s) => up({ avatarShape: s ?? "cookie12" })} />
      </Section>
      <Section title={t.chips}>
        <ItemList items={h.chips} onChange={(chips) => up({ chips })} t={t} max={4} fresh={{ icon: "star", label: "New" }} />
      </Section>
    </>
  );
}

// About
function About({ c, set, t }: Props) {
  const up = (v: Partial<Config["about"]>) => set((c) => ({ ...c, about: { ...c.about, ...v } }));
  return (
    <>
      <Section>
        <Field label={t.title} value={c.about.title} onChange={(title) => up({ title })} maxLength={40} />
      </Section>
      <Section title={t.items}>
        <ItemList items={c.about.items} onChange={(items) => up({ items })} t={t} max={8} fresh={{ icon: "favorite", label: "" }} />
      </Section>
    </>
  );
}

// Stack
function Stack({ c, set, t }: Props) {
  const groups = c.stack.groups;
  const up = (v: Partial<Config["stack"]>) => set((c) => ({ ...c, stack: { ...c.stack, ...v } }));
  const upGroup = (i: number, v: Partial<Config["stack"]["groups"][number]>) => up({ groups: groups.map((g, j) => (j === i ? { ...g, ...v } : g)) });
  return (
    <>
      <Section>
        <Field label={t.title} value={c.stack.title} onChange={(title) => up({ title })} maxLength={40} />
      </Section>
      <AnimatePresence initial={false}>
        {groups.map((g, i) => (
          <motion.div key={i} className="group-card" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}>
            <div className="group-head">
              <Field value={g.title} placeholder={t.groupTitle} onChange={(title) => upGroup(i, { title })} maxLength={24} />
              <IconButton icon="delete" title={t.remove} onClick={() => up({ groups: groups.filter((_, j) => j !== i) })} />
            </div>
            <ItemList items={g.items} onChange={(items) => upGroup(i, { items })} t={t} max={14} prefer="brands" fresh={{ icon: "brand:github", label: "" }} />
          </motion.div>
        ))}
      </AnimatePresence>
      {groups.length < 5 && (
        <Button kind="outlined" icon="add" onClick={() => up({ groups: [...groups, { title: "", items: [] }] })}>
          {t.addGroup}
        </Button>
      )}
    </>
  );
}

// Projects
function Projects({ c, set, t, d }: Props) {
  const pr = c.projects;
  const up = (v: Partial<Config["projects"]>) => set((c) => ({ ...c, projects: { ...c.projects, ...v } }));
  const [open, setOpen] = useState<string | null>(null);
  const list = projectList(c, d);
  const toggle = (name: string) => {
    const has = pr.repos.includes(name);
    if (!has && pr.repos.length >= 6) return;
    up({ repos: has ? pr.repos.filter((r) => r !== name) : [...pr.repos, name] });
  };
  return (
    <>
      <Section title={t.source}>
        <Segmented
          value={pr.source}
          onChange={(source) => up({ source, repos: source === "manual" && !pr.repos.length ? d.pins.map((r) => r.name) : pr.repos })}
          options={[["pinned", t.pinned], ["manual", t.manual]]}
        />
        {pr.source === "pinned" && <p className="note">{t.pinnedNote}</p>}
      </Section>
      {pr.source === "manual" && (
        <Section title={t.pickRepos}>
          {d.all.length ? (
            <div className="chips-wrap">
              {d.all.map((r) => {
                const n = pr.repos.indexOf(r.name);
                return (
                  <motion.button key={r.name} type="button" layout className={`filter-chip${n >= 0 ? " on" : ""}`} onClick={() => toggle(r.name)} whileTap={{ scale: 0.92 }} transition={bouncy}>
                    {n >= 0 && <span className="chip-num">{n + 1}</span>}
                    {r.name}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <p className="note">{t.noRepos}</p>
          )}
        </Section>
      )}
      <Section title={t.blocks.projects}>
        <p className="note">{t.reorderNote}</p>
        <Reorder.Group
          axis="y"
          as="div"
          className="repo-list"
          values={list.map((r) => r.name)}
          onReorder={(repos: string[]) => up({ source: "manual", repos })}
        >
          {list.map((r, i) => (
            <RepoRow key={r.name} repo={r} index={i} c={c} t={t} open={open === r.name} onToggle={() => setOpen(open === r.name ? null : r.name)} up={up} />
          ))}
        </Reorder.Group>
      </Section>
      <Section>
        <Field label={t.emptyText} value={pr.empty} onChange={(empty) => up({ empty })} maxLength={60} />
        <Field label={t.forkLabel} value={pr.fork} onChange={(fork) => up({ fork })} maxLength={12} />
      </Section>
    </>
  );
}

function RepoRow({ repo: r, index, c, t, open, onToggle, up }: { repo: Repo; index: number; c: Config; t: Dict; open: boolean; onToggle: () => void; up: (v: Partial<Config["projects"]>) => void }) {
  const controls = useDragControls();
  const pr = c.projects;
  const o = pr.overrides[r.name] ?? {};
  const v = projectView(c, r, index);
  const setO = (x: Partial<typeof o>) => up({ overrides: { ...pr.overrides, [r.name]: { ...o, ...x } } });
  return (
    <Reorder.Item value={r.name} as="div" className={`repo${open ? " open" : ""}`} dragListener={false} dragControls={controls} transition={spring} whileDrag={{ scale: 1.03, zIndex: 5 }}>
      <div className="repo-head">
        <span className="grip" onPointerDown={(e) => controls.start(e)} title={t.move}>
          <Glyph name="drag_indicator" size={20} />
        </span>
        <button type="button" className="repo-open" onClick={onToggle}>
          <span className="repo-icon"><Glyph name={v.icon} size={20} /></span>
          <span className="repo-name">{r.name}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={bouncy} className="repo-chev">
            <Glyph name="keyboard_arrow_down" size={22} />
          </motion.span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="repo-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring}>
            <Field label={t.description} value={o.text ?? ""} placeholder={r.text || c.projects.empty} onChange={(text) => setO({ text })} multiline maxLength={120} />
            <div className="inline">
              <span className="field-label">{t.icon}</span>
              <IconSelect value={o.icon} onChange={(icon) => setO({ icon })} t={t} />
              {o.icon && <Button kind="text" onClick={() => setO({ icon: undefined })}>{t.auto}</Button>}
            </div>
            <span className="field-label">{t.shape}</span>
            <ShapePicker value={o.shape} onChange={(shape) => setO({ shape })} allowAuto autoLabel={t.auto} />
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

// Stats
function Stats({ c, set, t }: Props) {
  const s = c.stats;
  const up = (v: Partial<Config["stats"]>) => set((c) => ({ ...c, stats: { ...c.stats, ...v } }));
  return (
    <>
      <Section>
        <Field label={t.title} value={s.title} onChange={(title) => up({ title })} maxLength={40} />
      </Section>
      <Section title={t.tiles}>
        <div className="grid2">
          <Field value={s.stars} onChange={(stars) => up({ stars })} maxLength={24} />
          <Field value={s.contributions} onChange={(contributions) => up({ contributions })} maxLength={24} />
          <Field value={s.repos} onChange={(repos) => up({ repos })} maxLength={24} />
          <Field value={s.followers} onChange={(followers) => up({ followers })} maxLength={24} />
        </div>
      </Section>
      <Section>
        <Field label={t.calendar} value={s.calendar} onChange={(calendar) => up({ calendar })} maxLength={30} />
        <Field label={t.weekdays} value={s.weekdays} onChange={(weekdays) => up({ weekdays })} maxLength={7} />
        <Switch label={t.showLanguages} value={s.showLanguages} onChange={(showLanguages) => up({ showLanguages })} />
        {s.showLanguages && <Field label={t.languagesLabel} value={s.languages} onChange={(languages) => up({ languages })} maxLength={60} />}
      </Section>
    </>
  );
}

function AuthoredStats({ c, set, t }: Props) {
  const s = c.authoredStats;
  const up = (v: Partial<Config["authoredStats"]>) => set((c) => ({ ...c, authoredStats: { ...c.authoredStats, ...v } }));
  return <>
    <Section>
      <Field label={t.title} value={s.title} onChange={(title) => up({ title })} maxLength={40} />
      <Field label={t.languagesLabel} value={s.languages} onChange={(languages) => up({ languages })} maxLength={60} />
    </Section>
  </>;
}

// Streak
function Streak({ c, set, t }: Props) {
  const s = c.streak;
  const up = (v: Partial<Config["streak"]>) => set((c) => ({ ...c, streak: { ...c.streak, ...v } }));
  return (
    <Section>
      <Field label={t.title} value={s.title} onChange={(title) => up({ title })} maxLength={40} />
      <Field label={t.current} value={s.current} onChange={(current) => up({ current })} maxLength={30} />
      <Field label={t.longest} value={s.longest} onChange={(longest) => up({ longest })} maxLength={30} />
      <Field label={t.unit} value={s.days} onChange={(days) => up({ days })} maxLength={10} />
    </Section>
  );
}

// Socials
function Socials({ c, set, t }: Props) {
  const st = c.socials;
  const items = st.items.map((s) => ({ icon: s.icon, label: s.url }));
  const up = (v: Partial<Config["socials"]>) => set((c) => ({ ...c, socials: { ...c.socials, ...v } }));
  return (
    <>
    <Section title={t.socialView}>
      <Segmented value={st.variant} onChange={(variant) => up({ variant })} options={[["icon", t.socialIcons], ["chip", t.socialChips]]} />
      <Switch label={t.cardBg} value={!!st.card} onChange={(card) => up({ card })} />
      <div className="chips-wrap">
        {(Object.keys(t.socialFills) as Config["socials"]["fill"][]).map((f) => (
          <motion.button key={f} type="button" layout className={`filter-chip${st.fill === f ? " on" : ""}`} onClick={() => up({ fill: f })} whileTap={{ scale: 0.92 }} transition={bouncy}>
            {st.fill === f && <Glyph name="check" size={18} />}
            {t.socialFills[f]}
          </motion.button>
        ))}
      </div>
    </Section>
    <Section title={t.shape}>
      {st.variant === "icon" ? (
        <ShapePicker value={st.shape} onChange={(shape) => up({ shape })} allowAuto autoLabel={t.mix} />
      ) : (
        <Segmented value={st.shape === "soft" ? "soft" : "pill"} onChange={(v) => up({ shape: v === "soft" ? "soft" : undefined })} options={[["pill", t.rounded], ["soft", t.squarish]]} />
      )}
    </Section>
    <Section title={t.socialUrl}>
      <ItemList
        items={items}
        onChange={(v) => up({ items: v.map((i) => ({ icon: i.icon, url: i.label })) })}
        t={t}
        max={8}
        prefer="brands"
        fresh={{ icon: "brand:github", label: "https://" }}
      />
    </Section>
    </>
  );
}

// Buttons
function Buttons({ c, set, t }: Props) {
  const items = c.buttons.items;
  const up = (next: typeof items) => set((c) => ({ ...c, buttons: { ...c.buttons, items: next } }));
  return (
    <>
      <Switch label={t.cardBg} value={!!c.buttons.card} onChange={(card) => set((c) => ({ ...c, buttons: { ...c.buttons, card } }))} />
      <AnimatePresence initial={false}>
        {items.map((b, i) => {
          const setB = (v: Partial<typeof b>) => up(items.map((x, j) => (j === i ? { ...x, ...v } : x)));
          return (
            <motion.div key={i} className="group-card" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}>
              <div className="group-head">
                <IconSelect value={b.icon} onChange={(icon) => setB({ icon })} t={t} />
                <Field value={b.label} placeholder={t.label} onChange={(label) => setB({ label })} maxLength={28} />
                <IconButton icon="delete" title={t.remove} onClick={() => up(items.filter((_, j) => j !== i))} />
              </div>
              <Field label={t.link} value={b.url} placeholder={t.linkPlaceholder} onChange={(url) => setB({ url })} />
              <Segmented value={b.style} onChange={(style) => setB({ style })} options={[["filled", t.filled], ["tonal", t.tonal]]} />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {items.length < 4 && (
        <Button kind="outlined" icon="add" onClick={() => up([...items, { icon: "link", label: "Link", url: "https://", style: "tonal" }])}>
          {t.add}
        </Button>
      )}
    </>
  );
}

// Style
export const SEEDS = ["#FF5CA8", "#B36CFF", "#5C7CFF", "#2BB3C0", "#3DAA6B", "#C9A800", "#FF8A3D", "#E5484D"];

function Style({ c, set, t, avatarSeed, onReset, onImage }: Props & { avatarSeed: string | null; onReset: () => void; onImage: (f: File) => void }) {
  const preset = activePreset(c);
  return (
    <>
      <Section title={t.templates}>
        <div className="presets">
          {(Object.keys(PRESETS) as PresetId[]).map((id) => (
            <motion.button key={id} type="button" className={`preset${preset === id ? " on" : ""}`} onClick={() => set((c) => applyPreset(c, id))} whileTap={{ scale: 0.94 }} transition={bouncy}>
              <span className="preset-bars">
                {PRESETS[id].filter((b) => b !== "wave").slice(0, 5).map((b) => (
                  <span key={b} className={`bar bar-${b}`} />
                ))}
              </span>
              <span>{t.presets[id]}</span>
            </motion.button>
          ))}
        </div>
      </Section>
      <Section title={t.seed}>
        <div className="swatches">
          {SEEDS.map((s) => (
            <motion.button key={s} type="button" className={`swatch${c.seed.toUpperCase() === s ? " on" : ""}`} style={{ background: s }} onClick={() => set((c) => ({ ...c, seed: s, seedFromAvatar: false }))} whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} transition={bouncy} aria-label={s}>
              {c.seed.toUpperCase() === s && <Glyph name="check" size={20} />}
            </motion.button>
          ))}
          <label className={`swatch custom${!SEEDS.includes(c.seed.toUpperCase()) ? " on" : ""}`} title={t.custom} style={{ background: c.seed }}>
            <Glyph name="palette" size={20} />
            <input type="color" value={c.seed} onChange={(e) => set((c) => ({ ...c, seed: e.target.value.toUpperCase(), seedFromAvatar: false }))} />
          </label>
        </div>
        <label className="from-avatar file">
          <Glyph name="add_photo_alternate" size={22} />
          {t.fromImage}
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage(f); e.target.value = ""; }} />
        </label>
        {avatarSeed && (
          <button type="button" className={`from-avatar${c.seedFromAvatar ? " on" : ""}`} onClick={() => set((c) => ({ ...c, seed: avatarSeed, seedFromAvatar: true }))}>
            <span className="dot" style={{ background: avatarSeed }} />
            {t.fromAvatar}
          </button>
        )}
      </Section>
      <Section title={t.scheme}>
        <div className="chips-wrap">
          {(Object.keys(t.schemes) as SchemeName[]).map((s) => (
            <motion.button key={s} type="button" layout className={`filter-chip${c.scheme === s ? " on" : ""}`} onClick={() => set((c) => ({ ...c, scheme: s }))} whileTap={{ scale: 0.92 }} transition={bouncy}>
              {c.scheme === s && <Glyph name="check" size={18} />}
              {t.schemes[s]}
            </motion.button>
          ))}
        </div>
      </Section>
      <Section>
        <Switch label={t.iconFill} value={c.iconFill !== false} onChange={(iconFill) => set((c) => ({ ...c, iconFill }))} />
        <Switch label={t.motion} value={c.motion} onChange={(motion) => set((c) => ({ ...c, motion }))} />
      </Section>
      <Section>
        <Button kind="text" icon="restart_alt" onClick={onReset}>{t.reset}</Button>
      </Section>
    </>
  );
}

export function SheetBody({ id, ...p }: Props & { id: SheetId; avatarSeed: string | null; onReset: () => void; onImage: (f: File) => void }) {
  if (id === "hero") return <Hero {...p} />;
  if (id === "about") return <About {...p} />;
  if (id === "stack") return <Stack {...p} />;
  if (id === "projects") return <Projects {...p} />;
  if (id === "stats") return <Stats {...p} />;
  if (id === "authoredStats") return <AuthoredStats {...p} />;
  if (id === "buttons") return <Buttons {...p} />;
  if (id === "streak") return <Streak {...p} />;
  if (id === "socials") return <Socials {...p} />;
  return <Style {...p} />;
}
