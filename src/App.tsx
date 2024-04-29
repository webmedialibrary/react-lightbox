import { useEffect, useMemo, useState } from "react"
import "./App.css"

import { Lightbox, LightboxAdapter } from "./components/Lightbox"

const maxElements = 20;
const elementsPerLoad = 10;

const minRatio = 9 / 21;
const maxRatio = 21 / 9;

const elements = new Array(maxElements);
for (let i = 0; i < maxElements; i++) {
  elements[i] = minRatio + (maxRatio - minRatio) * Math.random();
}

function App() {
  // console.clear();

  const [focus, setFocus] = useState<number | null>(null);

  const [open, setOpen] = useState(false);

  const adapter: LightboxAdapter<number> = {
    renderElement: (n, {onLoad, width, height}) => {
      const ratio = elements[n];
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
    renderThumbnail: (n, {onLoad, width, height}) => {
      const h = height;
      const w = Math.round(elements[n] * h);
      const src = `https://picsum.photos/seed/${seed(n)}/${w}/${h}`;
      return <img key={n} src={src} alt={`Image ${n}`} width={w} height={h} draggable={false} className="lightbox-thumbnail" onLoad={onLoad} />
    },
    loadElementsBefore: async (n) => {
      const list = Array<number>();
      for (let i = n - 1; i >= 0 && list.length < elementsPerLoad; i--) {
        list.unshift(i);
      }
      console.log("loadElementsBefore", n, list);
      return list;
    },
    loadElementsAfter: async (n) => {
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

  const images = useMemo(() => {
    const images = [];
    for (let i = 0; i < 10; i++) {
      const height = 180;
      const width = Math.round(elements[i] * height);
      const src = `https://picsum.photos/seed/${seed(i)}/${width}/${height}`;
      images.push(<img key={i} src={src} alt={`Image ${i}`} className="thumbnail" onClick={() => openLightbox(i)} width={width} height={height} />);
    }
    return images;
  }, []);

  // useEffect(() => {
  //   function handleTouchMove(ev: Event) {
  //     console.log("touchmove");
  //     // ev.preventDefault();
  //   }
  //   document.addEventListener("touchmove", handleTouchMove, {passive: false});
  //   return () => document.removeEventListener("touchmove", handleTouchMove);
  // }, []);

  return (
    <>
      <div className="gallery">{images}</div>
      {focus !== null && <Lightbox adapter={adapter} open={open} onClose={() => setOpen(false)} focus={focus} onFocusChange={setFocus} thumbnailHeight={90}/>}
    </>
  )
}

function seed(n: number): string {
  return `${n + 1}`
}

export default App
