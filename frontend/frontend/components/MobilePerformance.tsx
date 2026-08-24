"use client";

import { MotionConfig } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px), (hover: none) and (pointer: coarse)";

export default function MobilePerformance({
  children,
}: {
  children: ReactNode;
}) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);

    const update = () => {
      setMobile(query.matches);
      document.documentElement.dataset.mobileUi = query.matches
        ? "true"
        : "false";
    };

    update();
    query.addEventListener?.("change", update);

    return () => {
      query.removeEventListener?.("change", update);
      delete document.documentElement.dataset.mobileUi;
    };
  }, []);

  return (
    <MotionConfig
      reducedMotion={mobile ? "always" : "user"}
      transition={mobile ? { duration: 0.18, ease: "easeOut" } : undefined}
    >
      <div className="mobile-performance-root">{children}</div>
    </MotionConfig>
  );
}
