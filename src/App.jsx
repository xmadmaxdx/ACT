import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Hero from "./components/Hero.jsx";
import ActionCards from "./components/ActionCards.jsx";
import Footer from "./components/Footer.jsx";
import Practice from "./components/Practice.jsx";
import TestScreen from "./components/TestScreen.jsx";
import Results from "./components/Results.jsx";
import Loader, { LoaderError } from "./components/Loader.jsx";
import { fetchCatalog } from "./supabase.js";
import "./styles.css";

function slugFor(skill) {
  const m = /^([A-Z]+)-(.+)$/.exec(skill.id || "");
  if (!m) return "/practice";
  return `/practice-test-${m[2].toLowerCase()}-${m[1].toLowerCase()}`;
}

function routeFromPath(path) {
  if (path.endsWith("/results")) return "results";
  if (path === "/practice") return "practice";
  if (path.startsWith("/practice-test-")) return "test";
  return "home";
}

export default function App() {
  const [route, setRoute] = useState(() => {
    const r = routeFromPath(window.location.pathname);
    if (r === "test" || r === "results") {
      window.history.replaceState({}, "", "/practice");
      return "practice";
    }
    return r;
  });
  const [session, setSession] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const sessionRef = useRef(null);
  sessionRef.current = session;

  useEffect(() => {
    let live = true;
    fetchCatalog()
      .then((tests) => {
        if (!live) return;
        console.info(`ACTprep catalog source: supabase (${tests.length} tests)`);
        setCatalog(tests);
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
    if (r === "practice") {
      window.history.pushState({}, "", "/practice");
      setRoute("practice");
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
      const t = findTest(s.skill.id);
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
        onFinish={finishTest}
        onExit={() => {
          if (reviewing) {
            window.history.pushState({}, "", `${slugFor(session.skill)}/results`);
            setReviewIndex(null);
            setRoute("results");
          } else {
            navigate("practice");
          }
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (route === "results" && session) {
    const testData = findTest(session.skill.id);
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
      <div className="page">
        <Sidebar active={route} onNavigate={navigate} />
        <main className="content">
          {route === "practice" ? (
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
