import { useMemo, useState } from "react"
import "./App.css"

import { Lightbox, LightboxAdapter } from "./components/Lightbox"

const maxElements = 20;
const elementsPerLoad = 10;

const minRatio = 1 / 1;
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
    renderElement: (n, p) => {
      const { onLoad, width: w, height: h } = p;
      const ratio = elements[n];
      let width: number, height: number;
      if (w / h > ratio) {
        width = Math.round(h * ratio);
        height = h;
      } else {
        width = w;
        height = Math.round(w / ratio);
      }
      const src = `https://picsum.photos/seed/${seed(n)}/${width}/${height}`;
      return <img key={n} src={src} alt={`Image ${n}`} width={width} height={height} draggable={false} className="lightbox-element" onLoad={onLoad} />
    },
    renderThumbnail: (n, p) => {
      const { onLoad } = p;
      const height = 180;
      const width = Math.round(elements[n] * height);
      const src = `https://picsum.photos/seed/${seed(n)}/${width}/${height}`;
      return <img key={n} src={src} alt={`Image ${n}`} width={width} height={height} draggable={false} className="lightbox-thumbnail" onLoad={onLoad} />
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


  return (
    <>
      <div className="gallery">{images}</div>
      {focus !== null && <Lightbox adapter={adapter} open={open} onClose={() => setOpen(false)} focus={focus} onFocusChange={setFocus} />}
    </>
  )
}

function seed(n: number): string {
  return `${n + 1}`
}

export default App
