import { hexFromArgb, sourceColorFromImage } from "@material/material-color-utilities";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { projectList } from "../render/blocks";
import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import { BLOCKS, defaults, palette, render, REPO_URL, slug, usedIcons, type BlockId, type Config, type Data, type ShapeName } from "../render";
import { buildZip, DEMO, hasIcon, LoadError, loadAllIcons, loadProfile, ProfileExportError, profileFiles, store } from "./data";
import { existingReadme, install, InstallError, requestCode, waitForToken, whoami, type DeviceCode } from "./install";
import { SheetBody, type SheetId } from "./editors";
import { TEXT, type Dict } from "./i18n";
import { bouncy, Button, Glyph, IconButton, Morph, spring, useCycle } from "./ui";

type Theme = "system" | "light" | "dark";
const DEMO_LOGIN = "nova";
const CYCLE: ShapeName[] = ["cookie", "clover", "sunny", "flower", "gem", "soft", "cookie12"];

// Storage
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
    return true;
  } catch (error) {
    console.error("Could not save profile settings", error);
    return false;
  }
}

function migrate(c: Config | null): Config {
  const base = defaults(DEMO_LOGIN);
  if (!c || c.version !== 1) return base;
  return {
    ...base,
    ...c,
    hero: { ...base.hero, ...c.hero },
    about: { ...base.about, ...c.about },
    stack: { ...base.stack, ...c.stack },
    projects: { ...base.projects, ...c.projects },
    stats: { ...base.stats, ...c.stats },
    buttons: { ...base.buttons, ...c.buttons },
    streak: { ...base.streak, ...c.streak },
    socials: { ...base.socials, ...c.socials },
    order: placeNew(c.order.filter((b) => BLOCKS.includes(b))),
  };
}

function placeNew(order: BlockId[]) {
  const out = [...order];
  BLOCKS.forEach((b, i) => {
    if (out.includes(b)) return;
    const prev = BLOCKS.slice(0, i).reverse().find((x) => out.includes(x));
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, b);
  });
  return out;
}

// Share
function encode(c: Config) {
  const bin = deflateSync(strToU8(JSON.stringify(c)), { level: 9 });
  let s = "";
  for (const b of bin) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(s: string): Config | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(strFromU8(inflateSync(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)))));
  } catch {
    return null;
  }
}

function sharedFromHash() {
  const m = /[#&]c=([^&]+)/.exec(location.hash);
  return m ? decode(m[1]) : null;
}

function remixFrom(theirs: Config, login: string): Config {
  const base = defaults(login);
  return {
    ...base,
    seed: theirs.seed ?? base.seed,
    seedFromAvatar: false,
    scheme: theirs.scheme ?? base.scheme,
    skin: theirs.skin ?? base.skin,
    motion: theirs.motion ?? base.motion,
    order: theirs.order ?? base.order,
    hidden: theirs.hidden ?? base.hidden,
    hero: { ...base.hero, avatarShape: theirs.hero?.avatarShape ?? base.hero.avatarShape, typing: theirs.hero?.typing ?? base.hero.typing },
  };
}

// Preview
function useBlobUrls(files: Record<string, string>) {
  const cache = useRef(new Map<string, { svg: string; url: string }>());
  return useMemo(() => {
    const out: Record<string, string> = {};
    for (const [path, svg] of Object.entries(files)) {
      const hit = cache.current.get(path);
      if (hit && hit.svg === svg) {
        out[path] = hit.url;
        continue;
      }
      if (hit) setTimeout(() => URL.revokeObjectURL(hit.url), 4000);
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      cache.current.set(path, { svg, url });
      out[path] = url;
    }
    return out;
  }, [files]);
}

function useDark(theme: Theme) {
  const [sys, setSys] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const m = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSys(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return theme === "system" ? sys : theme === "dark";
}

function useWide() {
  const [wide, setWide] = useState(() => innerWidth >= 1100);
  useEffect(() => {
    const on = () => setWide(innerWidth >= 1100);
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);
  return wide;
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

// App
export default function App() {
  const t = TEXT;
  const [shared] = useState(sharedFromHash);
  const [from] = useState(() => new URLSearchParams(location.search).get("from"));
  const [config, setConfig] = useState<Config>(() => migrate(shared ?? read<Config | null>("ep:config", null)));
  const [theme, setTheme] = useState<Theme>(() => read<Theme>("ep:theme", "system"));
  const dark = useDark(theme);
  const wide = useWide();
  const [data, setData] = useState<Data>(DEMO);
  const [exact, setExact] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(config.login === DEMO_LOGIN ? "" : config.login);
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);
  const [iconsTick, setIconsTick] = useState(0);
  const isDemo = config.login === DEMO_LOGIN;
  const [landing, setLanding] = useState(Boolean(from));
  const field = useRef<HTMLInputElement>(null);

  const set = useCallback((fn: (c: Config) => Config) => setConfig(fn), []);

  useEffect(() => {
    if (!write("ep:config", config)) setToast(t.saveFailed);
  }, [config]);
  useEffect(() => { write("ep:theme", theme); }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (usedIcons(config, data).some((n) => !hasIcon(n))) loadAllIcons().then(() => setIconsTick((x) => x + 1));
  }, [config, data]);

  const p = useMemo(() => palette(config.seed, config.scheme, dark, config.skin), [config.seed, config.scheme, dark, config.skin]);
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(p)) root.style.setProperty(`--${kebab(k)}`, v);
    root.style.colorScheme = dark ? "dark" : "light";
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.skin = config.skin ?? "expressive";
  }, [p, dark, config.skin]);

  const load = useCallback(
    async (login: string) => {
      const name = login.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//, "").split("/")[0];
      if (!name) return;
      setLoading(true);
      try {
        const r = await loadProfile(name);
        if (r.stale) setToast(t.stale);
        setData(r.data);
        setExact(!!r.exact);
        setAvatar(r.avatar);
        setInput(name);
        setConfig((c) => ({ ...c, login: name }));
      } catch (e) {
        if (e instanceof LoadError && e.message === "limit" && e.reset) {
          setToast(t.limitAt.replace("{time}", e.reset.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })));
        } else setToast(e instanceof LoadError ? t[e.message as "limit" | "notFound" | "failed"] : t.failed);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!isDemo && !from) load(config.login);
    if (shared) {
      setToast(t.shared);
      history.replaceState(null, "", location.pathname + location.search);
    }
  }, []);

  const share = async () => {
    const url = `${location.origin}${location.pathname}#c=${encode(config)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      prompt(t.share, url);
    }
    setToast(t.copied);
  };

  const fromImage = async (f: File) => {
    const url = URL.createObjectURL(f);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const argb = await sourceColorFromImage(img);
      setConfig((c) => ({ ...c, seed: hexFromArgb(argb).toUpperCase(), seedFromAvatar: false }));
    } catch {
      setToast(t.failed);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const leaveLanding = (next: Config) => {
    history.replaceState(null, "", location.pathname);
    setConfig(next);
    setInput("");
    setData(DEMO);
    setAvatar(null);
    setLanding(false);
    setTimeout(() => field.current?.focus(), 400);
  };

  useEffect(() => {
    const source = config.hero.image || avatar;
    if (!source) return setAvatarSeed(null);
    const img = new Image();
    img.src = source;
    img.decode().then(() => sourceColorFromImage(img)).then((argb) => setAvatarSeed(hexFromArgb(argb).toUpperCase())).catch(() => setAvatarSeed(null));
  }, [avatar, config.hero.image]);

  useEffect(() => {
    if (avatarSeed && config.seedFromAvatar && config.seed !== avatarSeed) setConfig((c) => ({ ...c, seed: avatarSeed }));
  }, [avatarSeed, config.seedFromAvatar]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDialog(false);
        setSheet(null);
      }
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, []);

  const deferred = useDeferredValue(config);
  const files = useMemo(() => render(deferred, data, store, avatar, [dark ? "dark" : "light"]), [deferred, data, avatar, dark, iconsTick]);
  const urls = useBlobUrls(files);
  const src = (name: string) => urls[`assets/${name}-${dark ? "dark" : "light"}.svg`];
  const attr = (name: string, key: string) => Number(new RegExp(`${key}="([0-9.]+)"`).exec(files[`assets/${name}-${dark ? "dark" : "light"}.svg`] ?? "")?.[1] ?? 0);
  const width = (name: string) => attr(name, "width");
  const ratio = (name: string) => attr(name, "height") / (attr(name, "width") || 1);
  const body = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(e.contentRect.width / 840));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visible = config.order.filter((b) => !config.hidden.includes(b));
  const hidden = config.order.filter((b) => config.hidden.includes(b));
  const hide = (id: BlockId) => {
    setConfig((c) => ({ ...c, hidden: [...c.hidden, id] }));
    if (sheet === id) setSheet(null);
  };
  const show = (id: BlockId) => setConfig((c) => ({ ...c, hidden: c.hidden.filter((x) => x !== id) }));

  const download = async () => {
    if (isDemo) {
      setToast(t.needLogin);
      field.current?.focus();
      return;
    }
    setDialog(true);
  };

  const reset = () => {
    if (!confirm(t.resetConfirm)) return;
    setConfig(defaults(config.login));
  };

  const shiftForSheet = wide && sheet ? 440 : 0;

  if (landing && from) {
    return (
      <div className="app">
        <Backdrop />
        <Landing
          login={from}
          t={t}
          dark={dark}
          onRemix={(theirs) => {
            leaveLanding(remixFrom(theirs, DEMO_LOGIN));
            setToast(t.remixed);
          }}
          onScratch={() => leaveLanding(defaults(DEMO_LOGIN))}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Backdrop />
      <header className="topbar">
        <Logo />
        <form
          className="login"
          onSubmit={(e) => {
            e.preventDefault();
            load(input);
          }}
        >
          <Glyph name="brand:github" size={22} />
          <input ref={field} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.login} spellCheck={false} autoCapitalize="off" aria-label={t.login} />
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span key="l" className="login-state" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={bouncy}>
                <Loader />
              </motion.span>
            ) : (
              <motion.button key="b" type="submit" className="login-go" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={bouncy} whileTap={{ scale: 0.85 }} aria-label={t.load}>
                <Glyph name="arrow_outward" size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </form>
        <div className="actions">
          <IconButton icon="share" title={t.share} onClick={share} />
          <IconButton icon="palette" title={t.style} onClick={() => setSheet(sheet === "style" ? null : "style")} active={sheet === "style"} />
          <IconButton
            icon={theme === "dark" ? "dark_mode" : theme === "light" ? "light_mode" : "contrast"}
            title={`${t.theme}: ${t[theme]}`}
            onClick={() => setTheme(theme === "system" ? (dark ? "light" : "dark") : theme === "dark" ? "light" : "system")}
          />
          <Button icon="download" onClick={download}>{t.download}</Button>
        </div>
      </header>

      <main className="stage">
        <motion.div className="stage-inner" animate={{ paddingRight: shiftForSheet }} transition={spring}>
          <AnimatePresence initial={false}>
            {(isDemo || data !== DEMO) && (
              <motion.div key={isDemo ? "demo" : "live"} className="banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
                <Glyph name="info" size={20} />
                <span>{isDemo ? t.demo : exact ? t.previewExact : t.preview}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`paper${dark ? " dark" : ""}`}>
            <div className="paper-head">
              <Glyph name="book_2" size={16} />
              <span>{config.login} / README.md</span>
            </div>
            <Reorder.Group
              ref={body}
              axis="y"
              as="div"
              className="paper-body"
              values={visible}
              onReorder={(next: BlockId[]) => setConfig((c) => ({ ...c, order: [...next, ...c.order.filter((b) => c.hidden.includes(b))] }))}
            >
              {visible.map((id) => (
                <Block key={id} id={id} t={t} active={sheet === id} onEdit={id === "wave" ? undefined : () => setSheet(id as SheetId)} onHide={() => hide(id)}>
                  <BlockView id={id} config={deferred} data={data} src={src} size={(n) => width(n) * Math.min(1, k)} fill={(n) => width(n) * k} ratio={ratio} />
                </Block>
              ))}
            </Reorder.Group>
            <div className="credit">
              <img draggable={false} src={src("credit")} alt="Made with Expressive Profile" style={{ width: width("credit") * Math.min(1, k), height: width("credit") * Math.min(1, k) * ratio("credit") }} />
            </div>
          </div>

          <AnimatePresence>
            {hidden.length > 0 && (
              <motion.div className="tray" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={spring}>
                <span className="tray-title">{t.hidden}</span>
                <div className="chips-wrap">
                  <AnimatePresence>
                    {hidden.map((id) => (
                      <motion.button key={id} type="button" layout className="filter-chip" onClick={() => show(id)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} whileTap={{ scale: 0.9 }} transition={bouncy}>
                        <Glyph name="add" size={18} />
                        {t.blocks[id]}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <AnimatePresence>
        {sheet && (
          <Sheet key="sheet" wide={wide} title={sheet === "style" ? t.style : t.blocks[sheet]} onClose={() => setSheet(null)} t={t}>
            <SheetBody key={sheet} id={sheet} c={config} set={set} t={t} d={data} avatarSeed={avatarSeed} onReset={reset} onImage={fromImage} />
          </Sheet>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dialog && (
          <GetDialog
            t={t}
            config={config}
            data={data}
            avatar={avatar}
            onLogin={(login) => setConfig((c) => ({ ...c, login }))}
            onClose={() => setDialog(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={bouncy}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Parts
function Logo() {
  const shape = useCycle(CYCLE, 2600);
  return (
    <div className="logo">
      <motion.span className="logo-mark" whileHover={{ rotate: 90, scale: 1.1 }} transition={bouncy}>
        <Morph shape={shape} size={34} />
      </motion.span>
      <span className="logo-text">Expressive Profile</span>
    </div>
  );
}

function Loader() {
  const shape = useCycle(CYCLE, 520);
  return <Morph shape={shape} size={26} spin className="loader" />;
}

function Backdrop() {
  const a = useCycle(CYCLE, 5200);
  const b = useCycle([...CYCLE].reverse(), 6100);
  return (
    <div className="backdrop" aria-hidden="true">
      <Morph shape={a} size={620} className="bd bd-a" />
      <Morph shape={b} size={420} className="bd bd-b" />
    </div>
  );
}

function Block({ id, t, children, active, onEdit, onHide }: { id: BlockId; t: Dict; children: ReactNode; active: boolean; onEdit?: () => void; onHide: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      as="div"
      className={`block${active ? " active" : ""}${onEdit ? " editable" : ""}`}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={spring}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      onClick={onEdit}
    >
      {children}
      <div className="block-tools" onClick={(e) => e.stopPropagation()}>
        <span className="tool grip" onPointerDown={(e) => controls.start(e)} title={t.move}>
          <Glyph name="drag_indicator" size={20} />
        </span>
        {onEdit && <IconButton icon="edit" title={t.edit} onClick={onEdit} />}
        <IconButton icon="visibility_off" title={t.hide} onClick={onHide} />
      </div>
    </Reorder.Item>
  );
}

function BlockView({ id, config, data, src, size, fill, ratio }: { id: BlockId; config: Config; data: Data; src: (n: string) => string; size: (n: string) => number; fill: (n: string) => number; ratio: (n: string) => number }) {
  if (id === "projects") {
    const repos = projectList(config, data);
    return (
      <div className="cards">
        {repos.map((r) => (
          <img draggable={false} key={r.name} src={src(`project-${slug(r.name)}`)} alt={r.name} style={{ aspectRatio: 1 / (ratio(`project-${slug(r.name)}`) || 1) }} />
        ))}
      </div>
    );
  }
  if (id === "socials") return <LinkRow prefix="social" count={config.socials.items.length} src={src} size={size} fill={fill} ratio={ratio} />;
  if (id === "buttons") return <LinkRow prefix="button" count={config.buttons.items.length} src={src} size={size} fill={fill} ratio={ratio} />;
  return <img draggable={false} className="full" src={src(id)} alt={id} style={{ aspectRatio: 1 / (ratio(id) || 1) }} />;
}

function LinkRow({ prefix, count, src, size, fill, ratio }: { prefix: string; count: number; src: (n: string) => string; size: (n: string) => number; fill: (n: string) => number; ratio: (n: string) => number }) {
  const card = !!src(`${prefix}-l`);
  const names = Array.from({ length: count }, (_, i) => `${prefix}-${i + 1}`);
  if (card) names.unshift(`${prefix}-l`), names.push(`${prefix}-r`);
  return (
    <div className={`buttons${card ? " row-card" : ""}`}>
      {names.map((n) => (
        <img draggable={false} key={n} src={src(n)} alt="" style={{ width: card ? fill(n) : size(n), height: (card ? fill(n) : size(n)) * ratio(n) }} />
      ))}
    </div>
  );
}

function Sheet({ title, children, onClose, wide, t }: { title: string; children: ReactNode; onClose: () => void; wide: boolean; t: Dict }) {
  const from = wide ? { x: 480, opacity: 0.4 } : { y: "100%" };
  return (
    <>
      {!wide && <motion.div className="scrim sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      <motion.aside className={`sheet${wide ? " side" : " bottom"}`} initial={from} animate={{ x: 0, y: 0, opacity: 1 }} exit={from} transition={spring}>
        <div className="sheet-head">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h2 key={title} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={spring}>
              {title}
            </motion.h2>
          </AnimatePresence>
          <IconButton icon="close" title={t.close} onClick={onClose} />
        </div>
        <div className="sheet-body">{children}</div>
      </motion.aside>
    </>
  );
}

type Phase = "choose" | "zip" | "code" | "confirm" | "work" | "done" | "error";

function GetDialog({ t, config, data, avatar, onLogin, onClose }: { t: Dict; config: Config; data: Data; avatar: string | null; onLogin: (l: string) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [code, setCode] = useState<DeviceCode | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [zipFailed, setZipFailed] = useState(false);
  const [login, setLogin] = useState(config.login);
  const token = useRef("");
  const abort = useRef(new AbortController());
  useEffect(() => () => abort.current.abort(), []);

  const fail = (e: unknown) => {
    setZipFailed(false);
    const key = e instanceof InstallError ? e.message : "auth";
    if (key === "cancel") return;
    setError(e instanceof ProfileExportError ? t.exportFailed : (t.installErrors as Record<string, string>)[key] ?? t.installErrors.auth);
    setPhase("error");
  };

  const upload = async (who: string) => {
    setPhase("work");
    const c = { ...config, login: who };
    await install(token.current, who, await profileFiles(c, data, avatar), setStep);
    setPhase("done");
  };

  const start = async () => {
    try {
      abort.current = new AbortController();
      const dc = await requestCode();
      setCode(dc);
      setPhase("code");
      navigator.clipboard?.writeText(dc.user_code).catch(() => {});
      token.current = await waitForToken(dc, abort.current.signal);
      const who = await whoami(token.current);
      setLogin(who);
      if (who !== config.login) onLogin(who);
      if (await existingReadme(token.current, who)) setPhase("confirm");
      else await upload(who);
    } catch (e) {
      fail(e);
    }
  };

  const zip = async () => {
    try {
      await buildZip(config, data, avatar);
      setPhase("zip");
    } catch (e) {
      console.error("Profile export failed", e);
      setZipFailed(true);
      setError(t.exportFailed);
      setPhase("error");
    }
  };

  const panel = (key: string, body: ReactNode) => (
    <motion.div key={key} className="get-panel" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={spring}>
      {body}
    </motion.div>
  );

  let content: ReactNode;
  if (phase === "choose") {
    content = panel("choose", (
      <>
        <div className="dialog-hero">
          <Morph shape="sunny" size={64} spin />
          <h2>{t.getTitle}</h2>
        </div>
        <div className="get-options">
          <motion.button type="button" className="get-option main" onClick={start} whileTap={{ scale: 0.97 }} transition={bouncy}>
            <Glyph name="rocket_launch" size={28} />
            <span className="get-option-title">{t.optInstall}</span>
            <span className="get-option-text">{t.optInstallText}</span>
          </motion.button>
          <motion.button type="button" className="get-option" onClick={zip} whileTap={{ scale: 0.97 }} transition={bouncy}>
            <Glyph name="download" size={28} />
            <span className="get-option-title">{t.optZip}</span>
            <span className="get-option-text">{t.optZipText}</span>
          </motion.button>
        </div>
      </>
    ));
  } else if (phase === "zip") {
    content = panel("zip", <ZipSteps t={t} login={config.login} onAgain={() => buildZip(config, data, avatar)} />);
  } else if (phase === "code") {
    content = panel("code", (
      <div className="get-center">
        <h2>{t.codeTitle}</h2>
        <p>{t.codeText}</p>
        <button type="button" className="user-code" onClick={() => code && navigator.clipboard?.writeText(code.user_code)} title={t.copy}>
          {code?.user_code}
          <Glyph name="content_copy" size={22} />
        </button>
        <Button icon="open_in_new" href={code?.verification_uri}>{t.openGithub}</Button>
        <div className="get-wait"><Loader /> {t.waiting}</div>
      </div>
    ));
  } else if (phase === "confirm") {
    content = panel("confirm", (
      <div className="get-center">
        <Glyph name="info" size={40} className="get-icon" />
        <h2>{t.replaceTitle}</h2>
        <p>{t.replaceText.replace("{repo}", `${login}/${login}`)}</p>
        <div className="dialog-actions">
          <Button kind="text" onClick={onClose}>{t.cancel}</Button>
          <Button onClick={() => upload(login).catch(fail)}>{t.replace}</Button>
        </div>
      </div>
    ));
  } else if (phase === "work") {
    content = panel("work", (
      <div className="get-center">
        <h2>{t.installing}</h2>
        <ol className="work-steps">
          {t.workSteps.map((label, i) => (
            <li key={label} className={i < step ? "done" : i === step ? "now" : ""}>
              <span className="work-mark">{i < step ? <Glyph name="check" size={18} /> : i === step ? <Loader /> : null}</span>
              {label}
            </li>
          ))}
        </ol>
      </div>
    ));
  } else if (phase === "done") {
    content = panel("done", (
      <div className="get-center">
        <Morph shape="flower" size={72} spin className="get-icon" />
        <h2>{t.doneTitle}</h2>
        <p>{t.doneText}</p>
        <div className="dialog-actions center">
          <Button kind="tonal" icon="monitoring" href={`https://github.com/${login}/${login}/actions`}>{t.openActions}</Button>
          <Button icon="person" href={`https://github.com/${login}`}>{t.openProfile}</Button>
        </div>
      </div>
    ));
  } else {
    content = panel("error", (
      <div className="get-center">
        <Glyph name="info" size={40} className="get-icon" />
        <h2>{error}</h2>
        <div className="dialog-actions center">
          <Button kind="text" onClick={() => setPhase("choose")}>{t.back}</Button>
          <Button icon="restart_alt" onClick={zipFailed ? zip : start}>{t.retry}</Button>
        </div>
      </div>
    ));
  }

  return (
    <motion.div className="scrim" onClick={phase === "work" ? undefined : onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="dialog get" layout onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.88, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={spring}>
        {phase !== "work" && <div className="get-close"><IconButton icon="close" title={t.close} onClick={onClose} /></div>}
        <AnimatePresence mode="wait" initial={false}>{content}</AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function ZipSteps({ t, login, onAgain }: { t: Dict; login: string; onAgain: () => void }) {
  const steps: [string, ReactNode][] = [
    [t.dl1, <Button kind="tonal" icon="add" href={`https://github.com/new?name=${encodeURIComponent(login)}&visibility=public`}>{t.dl1Btn}</Button>],
    [t.dl2, <><Button kind="tonal" icon="upload" href={`https://github.com/${login}/${login}/upload/main`}>{t.dl2Btn}</Button><p className="note">{t.dl2Mac}</p></>],
    [t.dl3, null],
  ];
  return (
    <>
      <div className="dialog-hero">
        <Morph shape="sunny" size={64} spin />
        <h2>{t.dlTitle}</h2>
      </div>
      <ol className="steps">
        {steps.map(([text, extra], i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 + i * 0.08 }}>
            <span className="step-num">{i + 1}</span>
            <div className="step-body">
              <p>{text}</p>
              {extra}
            </div>
          </motion.li>
        ))}
      </ol>
      <div className="dialog-actions">
        <Button kind="text" icon="download" onClick={onAgain}>{t.dlAgain}</Button>
      </div>
    </>
  );
}

function Landing({ login, t, dark, onRemix, onScratch }: { login: string; t: Dict; dark: boolean; onRemix: (c: Config) => void; onScratch: () => void }) {
  const [theirs, setTheirs] = useState<Config | null>(null);
  const [missing, setMissing] = useState(false);
  const [view, setView] = useState<{ data: Data; avatar: string | null } | null>(null);
  useEffect(() => {
    const name = encodeURIComponent(login);
    fetch(`https://raw.githubusercontent.com/${name}/${name}/HEAD/profile.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((c: Config) => setTheirs(migrate(c)))
      .catch(() => setMissing(true));
    loadProfile(login).then(setView).catch(() => {});
  }, [login]);
  const hero = useMemo(() => {
    if (!theirs) return null;
    const theme = dark ? "dark" : "light";
    const svg = render(theirs, view?.data ?? DEMO, store, view?.avatar ?? null, [theme])[`assets/hero-${theme}.svg`];
    return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  }, [theirs, view, dark]);
  useEffect(() => () => {
    if (hero) URL.revokeObjectURL(hero);
  }, [hero]);
  return (
    <main className="landing">
      <motion.div className="land-card" initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
        <Logo />
        <h1>{t.landTitle}</h1>
        <p>{t.landText.replace("{login}", login)}</p>
        <div className="land-preview">
          <AnimatePresence mode="wait">
            {hero ? (
              <motion.img draggable={false} key="h" src={hero} alt={login} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={spring} />
            ) : missing ? (
              <motion.p key="m" className="note" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{t.landMissing}</motion.p>
            ) : (
              <motion.div key="l" className="land-loading" exit={{ opacity: 0 }}><Loader /></motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="land-actions">
          <Button icon="auto_awesome_mosaic" onClick={() => theirs && onRemix(theirs)} disabled={!theirs}>{t.landRemix}</Button>
          <Button kind="tonal" icon="edit_square" onClick={onScratch}>{t.landScratch}</Button>
          <Button kind="text" icon="brand:github" href={REPO_URL}>{t.landRepo}</Button>
        </div>
      </motion.div>
    </main>
  );
}
