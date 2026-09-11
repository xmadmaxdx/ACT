import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Hero from "./components/Hero.jsx";
import ActionCards from "./components/ActionCards.jsx";
import Footer from "./components/Footer.jsx";
import Practice from "./components/Practice.jsx";
import Chapters from "./components/Chapters.jsx";
import TestInfo from "./components/TestInfo.jsx";
import TestScreen from "./components/TestScreen.jsx";
import Results from "./components/Results.jsx";
import Loader, { LoaderError } from "./components/Loader.jsx";
import { fetchCatalog, fetchMinis } from "./supabase.js";
import "./styles.css";

function slugFor(skill) {
  const m = /^([A-Z]+)-(.+)$/.exec(skill.id || "");
  if (!m) return "/practice";
  return `/practice-test-${m[2].toLowerCase()}-${m[1].toLowerCase()}`;
}

function slugToId(path) {
  let p = path;
  if (p.endsWith("/results")) p = p.slice(0, -"/results".length);
  const m = /^\/practice-test-(.+)-([a-z0-9]+)$/.exec(p);
  if (!m) return null;
  return `${m[2].toUpperCase()}-${m[1].toUpperCase()}`;
}

function routeFromPath(path) {
  if (path.endsWith("/results")) return "results";
  if (path === "/practice") return "practice";
  if (path === "/test-info") return "info";
  if (path === "/chapters") return "chapters";
  if (path.startsWith("/practice-test-")) return "test";
  return "home";
}

export default function App() {
  const pendingRef = useRef(
    (() => {
      const p = window.location.pathname;
      const r = routeFromPath(p);
      return r === "test" || r === "results" ? p : null;
    })()
  );
  const minisRef = useRef([]);
  const [route, setRoute] = useState(() => {
    if (pendingRef.current) return "test";
    return routeFromPath(window.location.pathname);
  });
  const [session, setSession] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [customTestData, setCustomTestData] = useState(null);
  const [infoCourseOpen, setInfoCourseOpen] = useState(false);
  const sessionRef = useRef(null);
  sessionRef.current = session;
  const customRef = useRef(null);
  customRef.current = customTestData;

  useEffect(() => {
    let live = true;
    Promise.all([
      fetchCatalog(),
      fetchMinis().catch((e) => {
        window.console.debug("minis unavailable", e);
        return [];
      }),
    ])
      .then(([tests, minis]) => {
        if (!live) return;
        console.info(`ACTprep catalog source: supabase (${tests.length} tests)`);
        setCatalog(tests);
        minisRef.current = minis;
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending && !sessionRef.current) {
          const id = slugToId(pending);
          const match = (x) => x.id === id || x.id.toLowerCase() === (id || "").toLowerCase();
          const t = id && tests.find(match);
          const mini = !t && id ? minis.find(match) : null;
          const found = t || mini;
          if (found) {
            const skill = mini
              ? { id: found.id, title: found.title, meta: `${found.total} questions` }
              : { id: found.id, title: found.title, meta: `${found.total} questions · ${found.timeMinutes} min` };
            if (mini) {
              setCustomTestData(mini);
              customRef.current = mini;
            }
            const fresh = { skill, mode: "untimed", picks: {}, flags: {}, paces: {} };
            sessionRef.current = fresh;
            setSession(fresh);
            setReviewIndex(null);
            setRoute("test");
          } else {
            window.history.replaceState({}, "", "/practice");
            setRoute("practice");
          }
        }
      })
      .catch((e) => {
        if (live) setLoadError(e && e.message ? e.message : String(e));
      });
    return () => {
      live = false;
    };
  }, []);

  const findTest = useCallback(
    (id) => (catalog || []).find((t) => t.id === id) || null,
    [catalog]
  );

  const navigate = useCallback((r) => {
    setInfoCourseOpen(false);
    if (r === "practice") {
      window.history.pushState({}, "", "/practice");
      setRoute("practice");
    } else if (r === "info") {
      window.history.pushState({}, "", "/test-info");
      setRoute("info");
    } else if (r === "chapters") {
      window.history.pushState({}, "", "/chapters");
      setRoute("chapters");
    } else {
      window.history.pushState({}, "", "/");
      setRoute("home");
    }
    window.scrollTo(0, 0);
  }, []);

  const startTest = useCallback((skill, mode) => {
    setSession({ skill, mode, picks: {}, flags: {}, paces: {} });
    sessionRef.current = { skill, mode, picks: {}, flags: {}, paces: {} };
    setReviewIndex(null);
    window.history.pushState({}, "", slugFor(skill));
    setRoute("test");
    window.scrollTo(0, 0);
  }, []);

  const startLessonTest = useCallback((lessonTest, mode) => {
    const skill = { id: lessonTest.id, title: lessonTest.title, meta: `${lessonTest.total} questions` };
    setCustomTestData(lessonTest);
    setSession({ skill, mode, picks: {}, flags: {}, paces: {} });
    sessionRef.current = { skill, mode, picks: {}, flags: {}, paces: {} };
    setReviewIndex(null);
    window.history.pushState({}, "", slugFor(skill));
    setRoute("test");
    window.scrollTo(0, 0);
  }, []);

  const finishTest = useCallback(
    (data) => {
      setSession((s) => {
        const next = { ...s, ...data };
        sessionRef.current = next;
        return next;
      });
      window.history.pushState({}, "", `${slugFor(sessionRef.current.skill)}/results`);
      setRoute("results");
      window.scrollTo(0, 0);
    },
    []
  );

  const goReview = useCallback(
    (n) => {
      const s = sessionRef.current;
      if (!s) return;
      const custom = customRef.current;
      const t =
        custom && custom.id === s.skill.id ? custom : findTest(s.skill.id);
      const idx = t ? t.questions.findIndex((q) => q.n === n) : -1;
      setReviewIndex(idx >= 0 ? idx : 0);
      window.history.pushState({}, "", slugFor(s.skill));
      setRoute("test");
      window.scrollTo(0, 0);
    },
    [findTest]
  );

  useEffect(() => {
    const onPop = () => {
      const r = routeFromPath(window.location.pathname);
      if ((r === "test" || r === "results") && !sessionRef.current) {
        window.history.replaceState({}, "", "/practice");
        setRoute("practice");
      } else {
        if (r === "results" && sessionRef.current) {
          setReviewIndex(null);
        }
        setRoute(r);
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (loadError) {
    return <LoaderError message={loadError} />;
  }

  if (!catalog) {
    return <Loader />;
  }

  if (route === "test" && session) {
    const reviewing = reviewIndex !== null;
    return (
      <TestScreen
        key={`${session.skill.id}-${reviewing ? `r${reviewIndex}` : "take"}`}
        test={{ ...session.skill, mode: session.mode }}
        session={session}
        startIndex={reviewIndex || 0}
        review={reviewing}
        findTest={findTest}
        customTestData={customTestData}
        onFinish={finishTest}
        onExit={() => {
          window.history.back();
        }}
      />
    );
  }

  if (route === "results" && session) {
    const testData =
      customTestData && customTestData.id === session.skill.id
        ? customTestData
        : findTest(session.skill.id);
    if (!testData) {
      navigate("practice");
      return null;
    }
    return (
      <Results
        session={session}
        testData={testData}
        onGo={goReview}
        onRetake={() => startTest(session.skill, session.mode)}
        onExit={() => navigate("practice")}
      />
    );
  }

  return (
    <>
      <Header />
      <div className={route === "info" && infoCourseOpen ? "page full" : "page"}>
        {!(route === "info" && infoCourseOpen) && (
          <Sidebar active={route} onNavigate={navigate} />
        )}
        <main className="content">
          {route === "chapters" ? (
            <Chapters onStartMini={startLessonTest} />
          ) : route === "info" ? (
            <TestInfo onGiveTest={startLessonTest} onCourseOpen={setInfoCourseOpen} />
          ) : route === "practice" ? (
            <Practice
              onStartTest={startTest}
              passageTests={catalog.filter((t) => /-P\d+$/.test(t.id))}
            />
          ) : (
            <>
              <Hero />
              <hr className="divider" />
              <ActionCards onPractice={() => navigate("practice")} />
            </>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
