import { useState, useEffect, useRef } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient
} from "@tanstack/react-query";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useAuth,
  useClerk
} from "@clerk/react";
import { dark } from "@clerk/themes";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "@/pages/home";
import PostDetail from "@/pages/post-detail";
import Trending from "@/pages/trending";
import Landing from "@/pages/landing";
import Profile from "@/pages/profile";
import MyVibe from "@/pages/my-vibe";
import Compose from "@/pages/compose";

const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZmFuY3ktdW5pY29ybi03Ni5jbGVyay5hY2NvdW50cy5kZXYk";

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

console.info("UNSEEN: Clerk direct publishable key mode");

const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5
    }
  }
});

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`
  },
  variables: {
    colorPrimary: "#9d52ef",
    colorForeground: "#e2dff0",
    colorMutedForeground: "#8c87a8",
    colorDanger: "#ef4444",
    colorBackground: "#0a0719",
    colorInput: "#1b1729",
    colorInputForeground: "#e2dff0",
    colorNeutral: "#2d2640",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem"
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[#0a0719] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#2d2640]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#e2dff0] font-serif",
    headerSubtitle: "text-[#8c87a8]",
    socialButtonsBlockButtonText: "text-[#e2dff0]",
    formFieldLabel: "text-[#8c87a8]",
    footerActionLink: "text-[#9d52ef]",
    footerActionText: "text-[#8c87a8]",
    dividerText: "text-[#8c87a8]",
    identityPreviewEditButton: "text-[#9d52ef]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-[#e2dff0]",
    logoBox: "mb-2",
    logoImage: "h-8",
    socialButtonsBlockButton:
      "border-[#2d2640] hover:border-[#9d52ef]/50 bg-[#1b1729]",
    formButtonPrimary: "bg-[#9d52ef] hover:bg-[#8b40e0] text-white",
    formFieldInput: "bg-[#1b1729] border-[#2d2640] text-[#e2dff0]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#2d2640]",
    alert: "bg-[#1b1729] border-[#2d2640]",
    otpCodeFieldInput: "bg-[#1b1729] border-[#2d2640] text-[#e2dff0]",
    formFieldRow: "",
    main: ""
  }
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;

      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }

      prevUserIdRef.current = userId;
    });

    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full">
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          fallbackRedirectUrl={basePath || "/"}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full">
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          fallbackRedirectUrl={basePath || "/"}
        />
      </div>
    </div>
  );
}

function checkVisited(): boolean {
  try {
    if (localStorage.getItem("unseen_visited")) return true;
  } catch {}

  return /\buv=1\b/.test(document.cookie);
}

function markVisited() {
  try {
    localStorage.setItem("unseen_visited", "1");
  } catch {}

  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);

  document.cookie = `uv=1; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

function HomeGate() {
  const { isSignedIn, isLoaded } = useAuth();
  const [hasVisited, setHasVisited] = useState(() => checkVisited());

  const handleStart = () => {
    markVisited();
    setHasVisited(true);
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-background" />;
  }

  if (isSignedIn || hasVisited) {
    return (
      <AppLayout>
        <Home />
      </AppLayout>
    );
  }

  return <Landing onStart={handleStart} />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomeGate} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      <Route
        path="/post/:id"
        component={() => (
          <AppLayout>
            <PostDetail />
          </AppLayout>
        )}
      />

      <Route
        path="/trending"
        component={() => (
          <AppLayout>
            <Trending />
          </AppLayout>
        )}
      />

      <Route
        path="/profile"
        component={() => (
          <AppLayout>
            <Profile />
          </AppLayout>
        )}
      />

      <Route
        path="/my-vibe"
        component={() => (
          <AppLayout>
            <MyVibe />
          </AppLayout>
        )}
      />

      <Route path="/compose" component={() => <Compose />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
