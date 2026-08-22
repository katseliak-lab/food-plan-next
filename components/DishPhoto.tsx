"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { resolveDishImage } from "@/lib/dishImage";

interface Props {
  name?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Dish thumbnail over the striped placeholder; resolves a real photo from TheMealDB. */
export default function DishPhoto({ name, size = 240, className = "", style }: Props) {
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const clean = (name || "").trim();

  useEffect(() => {
    let alive = true;
    setUrl("");
    setLoaded(false);
    if (clean) {
      resolveDishImage(clean, size).then((u) => { if (alive) setUrl(u); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [clean, size]);

  return (
    <div className={"pho " + className} style={style}>
      {url && (
        <img
          src={url}
          alt={clean}
          onLoad={() => setLoaded(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .4s ease",
          }}
        />
      )}
    </div>
  );
}
