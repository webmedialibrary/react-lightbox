import { useEffect, useMemo, useRef, useState } from "react"
import "./App.css"

import { Lightbox, LightboxAdapter } from "./components/Lightbox"
import clsx from "clsx";

const maxElements = 20;
const elementsPerLoad = 10;

const ratios = [16 / 9, 4 / 3, 19 / 6, 1 / 2, 4 / 3, 1 / 1, 4 / 3, 4 / 3, 21 / 9, 1 / 1, 3 / 4, 21 / 9, 16 / 9];

function App() {
  // console.clear();

  const [focus, setFocus] = useState<number | null>(null);

  const [open, setOpen] = useState(false);

  const adapter: LightboxAdapter<number> = {
    renderElement: (n, { onLoad, width, height }) => {
      const ratio = ratios[n % ratios.length];
      let w: number, h: number;
      if (width / height > ratio) {
        w = Math.round(height * ratio);
        h = height;
      } else {
        w = width;
        h = Math.round(width / ratio);
      }
      const src = `https://picsum.photos/seed/${seed(n)}/${w}/${h}`;
      return <img key={n} src={src} alt={`Image ${n}`} width={w} height={h} draggable={false} className="lightbox-element" onLoad={onLoad} />
    },
    renderThumbnail: (n, { onLoad, width, height }) => {
      const h = height;
      const w = Math.round(ratios[n % ratios.length] * h);
      const src = `https://picsum.photos/seed/${seed(n)}/${w}/${h}`;
      return <img key={n} src={src} alt={`Image ${n}`} width={w} height={h} draggable={false} className="lightbox-thumbnail" onLoad={onLoad} />
    },
    renderHeading: (n) => `Image ${n + 1}`,
    loadElementsBefore: async (n) => {
      const list = Array<number>();
      for (let i = n - 1; i >= 0 && list.length < elementsPerLoad; i--) {
        list.unshift(i);
      }
      console.log("loadElementsBefore", n, list);
      return list;
    },
    loadElementsNext: async (n) => {
      const list = Array<number>();
      for (let i = n + 1; i < maxElements && list.length < elementsPerLoad; i++) {
        list.push(i);
      }
      console.log("loadElementsAfter", n, list);
      return list;
    },
  };

  function openLightbox(focus: number) {
    setOpen(true);
    setFocus(focus);
  }

  const focusRef = useRef<HTMLImageElement | null>(null);

  const images = useMemo(() => {
    const images = [];
    for (let n = 0; n < 10; n++) {
      const height = 180;
      const width = Math.round(ratios[n % ratios.length] * height);
      const src = `https://picsum.photos/seed/${seed(n)}/${width}/${height}`;
      images.push(<img key={n} src={src} alt={`Image ${n}`} className={clsx("thumbnail", n === focus && "thumbnail-focus")} onClick={() => openLightbox(n)} width={width} height={height} ref={n === focus ? focusRef : undefined} />);
    }
    return images;
  }, [focus]);

  return (
    <>
      <h1>Lightbox Example</h1>
      <p>Click on any image to open the lightbox.</p>
      <div className="gallery">{images}</div>
      {focus !== null && <Lightbox adapter={adapter} open={open} onClose={() => setOpen(false)} focus={focus} onFocusChange={setFocus} thumbnailHeight={90} focusRef={focusRef} />}
    </>
  )
}

function seed(n: number): string {
  return `${n + 1}`
}

export default App
