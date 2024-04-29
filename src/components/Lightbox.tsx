import clsx from "clsx";
import { create } from "jss";
import preset from "jss-preset-default";
import { Component, Key, ReactElement, ReactNode, createRef } from "react";
import { Transition } from "react-transition-group";

const jss = create(preset());

const duration = {
    standard: 300,
    short: 250,
    shorter: 200,
    shortest: 150,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
} as const;

const m = [64, 16, 8] as const; // margin

const styles = {
    lightbox: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        opacity: 0,
        transition: `opacity ${duration.leavingScreen}ms`,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
    },
    lightboxOpen: {
        opacity: 1,
        transition: `opacity ${duration.enteringScreen}ms`,
    },
    closeButton: {
        position: "fixed",
        top: 8,
        right: 8,
        padding: 4,
        border: "none",
        background: "none",
        cursor: "pointer",
        fill: "#d7d7d7",
        backgroundColor: "rgba(45, 45, 45, 0.5)",
        transition: `background-color ${duration.standard}ms`,
        "&:hover": {
            backgroundColor: "rgba(65, 65, 65, 0.5)",
        },
    },
    thumbnails: {
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 196,
        boxSizing: "border-box",
        transition: `opacity ease-out ${duration.shorter}ms, transform ease-out ${duration.standard}ms 150ms`,
    },
    thumbnailsZooming: {
        opacity: 0,
        transform: "translateY(40px)",
        transition: `opacity ease-in ${duration.standard}ms, transform ease-in ${duration.standard}ms`,
    },
    thumbnailContainer: {
        position: "fixed",
        bottom: 0,
        left: 0,
        height: 196,
    },
    thumbnail: {
        position: "fixed",
        bottom: 8,
        left: 0,
        background: "rgba(255, 255, 255, 0.1)",
        cursor: "pointer",
        "&:hover": {
            opacity: 0.8,
        },
        transition: `opacity ${duration.shorter}ms`,
        WebkitTapHighlightColor: "transparent",
    },
    thumbnailFocus: {
        boxShadow: "0 0 10px 2px #2486ffe6",
        background: "#2486ffe6",
        "&> $thumbnailWrapper": {
            opacity: .6
        }
    },
    thumbnailWrapper: {
        WebkitTapHighlightColor: "transparent",
    },
    svgIcon: {
        display: "block",
    },
    elementWrapper: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 196,
    },
    element: {
        position: "fixed",
        top: m[0],
        left: 0,
        width: "100%",
        boxSizing: "border-box",
        padding: `0 ${m[1]}px`,
        bottom: 220,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        visibility: "hidden",
    },
    heading: {
        margin: 0,
        padding: "16px 60px",
        fontWeight: "normal",
        color: "white",
        fontSize: "24px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textAlign: "center",
    },
}

const { classes } = jss.createStyleSheet(styles).attach();

type ElementProps = {
    width: number,
    height: number,
    onLoad: () => void,
}

export interface LightboxAdapter<Type> {
    renderElement: (element: Type, props: ElementProps) => ReactElement,
    renderThumbnail: (element: Type, props: ElementProps) => ReactElement,
    loadElementsBefore: (element: Type) => Promise<Type[]>,
    loadElementsAfter: (element: Type) => Promise<Type[]>,
}

export interface LightboxProps<Type> {
    adapter: LightboxAdapter<Type>,
    open: boolean,
    onClose: () => void,
    focus: Type,
    onFocusChange: (focus: Type) => void,
    thumbnailHeight?: number,
}

const defaultThumbnailHeight = 180;

interface LightboxState<Type> {
    loadingBefore: boolean,
    loadingAfter: boolean,
    zooming: boolean,
    elements: Type[],
}

export class Lightbox<Type> extends Component<LightboxProps<Type>, LightboxState<Type>> {

    ref = createRef<HTMLDivElement>();

    constructor(props: LightboxProps<Type>) {
        super(props);
        this.state = {
            loadingBefore: false,
            loadingAfter: false,
            elements: [this.props.focus],
            zooming: false,
        };
    }

    handleKeyDown = (ev: KeyboardEvent) => {
        switch (ev.key) {
            case "Escape":
                ev.preventDefault();
                this.props.onClose();
                break;
            case "ArrowLeft":
            case "ArrowUp":
                ev.preventDefault();
                var index = this.state.elements.indexOf(this.props.focus);
                if (index > 0) this.props.onFocusChange(this.state.elements[index - 1]);
                break;
            case "ArrowRight":
            case "ArrowDown":
                ev.preventDefault();
                var index = this.state.elements.indexOf(this.props.focus);
                if (index < this.state.elements.length - 1) this.props.onFocusChange(this.state.elements[index + 1]);
                break;
        }
    }

    get adapter() {
        return this.props.adapter;
    }

    get thumbnailHeight() {
        return this.props.thumbnailHeight ?? defaultThumbnailHeight;
    }

    loadingBefore = false;
    hasMoreBefore = true;

    loadElementsBefore() {
        if (this.loadingBefore || !this.hasMoreBefore) return;
        this.loadingBefore = true;
        this.setState({ loadingBefore: true });
        this.props.adapter.loadElementsBefore(this.state.elements[0]).then(n => {
            this.loadingBefore = false;
            this.hasMoreBefore = n.length > 0;
            this.setState(state => ({
                ...state,
                loadingBefore: false,
                elements: [...n, ...state.elements],
            }));
        });
    }

    loadingAfter = false;
    hasMoreAfter = true;

    loadElementsAfter() {
        if (this.loadingAfter || !this.hasMoreAfter) return;
        this.loadingAfter = true;
        this.setState({ loadingAfter: true });
        this.props.adapter.loadElementsAfter(this.state.elements[this.state.elements.length - 1]).then(n => {
            this.loadingAfter = false;
            this.hasMoreAfter = n.length > 0;
            this.setState(state => ({
                ...state,
                loadingAfter: false,
                elements: [...state.elements, ...n],
            }));
        });
    }

    get focus() {
        return this.props.focus;
    }

    selectBefore() {
        const index = this.state.elements.indexOf(this.focus);
        if (index > 0) {
            this.props.onFocusChange(this.state.elements[index - 1]);
            return true;
        }
        return false;
    }

    selectAfter() {
        const index = this.state.elements.indexOf(this.focus);
        if (index < this.state.elements.length - 1) {
            this.props.onFocusChange(this.state.elements[index + 1]);
            return true;
        }
        return false;
    }

    //

    refreshElements() {
        const index = this.state.elements.indexOf(this.props.focus);
        if (index === -1) {
            this.setState({
                elements: [this.props.focus],
                loadingAfter: false,
                loadingBefore: false,
            });
            return;
        }
    }

    componentDidMount(): void {
        window.addEventListener("keydown", this.handleKeyDown);

    }

    componentDidUpdate(prevProps: Readonly<LightboxProps<Type>>, prevState: Readonly<LightboxState<Type>>, snapshot?: any): void {
        this.refreshElements();
    }

    componentWillUnmount(): void {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    render(): ReactNode {
        const index = this.state.elements.indexOf(this.props.focus);
        if (index === -1) throw new Error("Focus not found in elements");

        const { adapter, open, onClose, focus, onFocusChange } = this.props;
        return <Transition in={open} timeout={{ appear: duration.enteringScreen, enter: duration.enteringScreen, exit: duration.leavingScreen }} nodeRef={this.ref} mountOnEnter unmountOnExit>
            {state => (
                <div className={clsx("lightbox", classes.lightbox, (state === "entered" || state === "entering") && classes.lightboxOpen)} ref={this.ref}>
                    <ThumbnailBar lightbox={this} />

                    <Accordion lightbox={this} />

                    <CloseButton onClick={onClose} />

                    <h1 className={classes.heading}>Lightbox</h1>

                    {/* <div>{focus !== null && adapter.renderThumbnail(focus)}</div> */}
                </div>
            )}
        </Transition>
    }
}

////////////////////////////////////////////////////////////////////////////////


interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

function CloseButton(props: CloseButtonProps) {
    return (
        <button className={clsx(classes.closeButton)} {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 -960 960 960" width="40" className={classes.svgIcon}>
                <path d="m251.333-204.667-46.666-46.666L433.334-480 204.667-708.667l46.666-46.666L480-526.666l228.667-228.667 46.666 46.666L526.666-480l228.667 228.667-46.666 46.666L480-433.334 251.333-204.667Z" />
            </svg>
        </button>
    )
}


////////////////////////////////////////////////////////////////////////////////


interface AccordionProps<T> {
    lightbox: Lightbox<T>,
}

interface AccordionState<T> {

}

const maxScale = 3;
const minScale = 0.5;

class Accordion<T> extends Component<AccordionProps<T>, AccordionState<T>> {

    lastFocus: T;

    constructor(props: AccordionProps<T>) {
        super(props);
        this.lastFocus = this.focus;
    }

    ref = createRef<HTMLDivElement>();
    refBefore = createRef<HTMLDivElement>();
    refAfter = createRef<HTMLDivElement>();

    translateX = 0;
    translateY = 0;
    scale = 1;

    get lightbox() {
        return this.props.lightbox;
    }

    get adapter() {
        return this.lightbox.adapter;
    }

    get focus() {
        return this.lightbox.props.focus;
    }

    handleResize = (ev: UIEvent) => {
        this.forceUpdate();
    }

    zoomResetTimeout: ReturnType<typeof setTimeout> | null = null;

    handleWheel = (ev: WheelEvent) => {
        ev.preventDefault();
        const scale = this.scale - ev.deltaY / 1000;

        if (!this.lightbox.state.zooming) {
            if (scale > 1) {
                this.lightbox.setState({ zooming: true });
            }
        }

        // if (this.lightbox.state.zooming) {
        this.pointScale(scale, ev.clientX, ev.clientY);
        this.updateTransform("ease-out");

        if (this.zoomResetTimeout) clearTimeout(this.zoomResetTimeout);
        this.zoomResetTimeout = setTimeout(() => {
            if (this.scale <= 1) {
                this.lightbox.setState({ zooming: false });
                this.zoomResetTimeout = null;
                this.scale = 1;
                this.translateX = 0;
                this.translateY = 0;
                this.updateTransform("ease-out");
            }
        }, duration.standard);
        // } else {

        // }
    }

    updateTransform = (easing: "instant" | "ease-out" | "ease-in-out") => {
        const element = this.ref.current! as HTMLElement;
        const image = element.firstChild as HTMLElement;

        if (this.scale < minScale) this.scale = minScale;
        if (this.scale > maxScale) this.scale = maxScale;

        if (this.scale <= 1) {
            this.translateY = 0;
        }
        if (this.scale > 1) {
            // const minTranslateX = image.offsetWidth*this.scale - window.innerWidth;
            // if (this.translateX > minTranslateX) this.translateX = minTranslateX;

        }

        element.style.visibility = "visible";
        const animation = element.animate([
            { transform: `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})` }
        ], {
            duration: easing === "instant" ? 0 : duration.standard,
            easing: easing === "instant" ? undefined : easing,
            fill: "both",
        });
        animation.onfinish = () => {
            element.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        }

        const elementAfter = this.refAfter.current as HTMLElement | null;
        if (elementAfter) {
            // elementAfter.style.display = this.translateX <= 0 ? "flex" : "none";
            if (this.translateX > 0 || this.scale < 1) elementAfter.style.visibility = "hidden";
            if (this.translateX < 0 && this.scale == 1) elementAfter.style.visibility = "visible";
            const imageAfter = elementAfter.firstChild as HTMLElement;
            const x = this.translateX + window.innerWidth - (window.innerWidth - imageAfter.offsetWidth) / 2;
            const animation = elementAfter.animate([
                { transform: `translate(${x}px` }
            ], {
                duration: easing === "instant" ? 0 : duration.standard,
                easing: easing === "instant" ? undefined : easing,
                fill: "both",
            });
            animation.onfinish = () => {
                elementAfter.style.transform = `translate(${x}px`;
            }
        }


        const elementBefore = this.refBefore.current as HTMLElement | null;
        if (elementBefore) {
            if (this.translateX < 0 || this.scale < 1) elementBefore.style.visibility = "hidden";
            if (this.translateX > 0 && this.scale == 1) elementBefore.style.visibility = "visible";
            // elementBefore.style.display = this.translateX >= 0 ? "flex" : "none";
            const imageBefore = elementBefore.firstChild as HTMLElement;
            const x = this.translateX - window.innerWidth + (window.innerWidth - imageBefore.offsetWidth) / 2;
            const animation = elementBefore.animate([
                { transform: `translate(${x}px` }
            ], {
                duration: easing === "instant" ? 0 : duration.standard,
                easing: easing === "instant" ? undefined : easing,
                fill: "both",
            });
            animation.onfinish = () => {
                elementBefore.style.transform = `translate(${x}px`;
            }
        }
    }

    pointers = new Map<number, { clientX: number, clientY: number, timeStamp: number }>();
    pointerDist = 0;

    handlePointerDown = (ev: React.PointerEvent) => {
        const { pointerId } = ev;
        // ev.preventDefault();
        this.pointers.set(pointerId, { clientX: ev.clientX, clientY: ev.clientY, timeStamp: ev.timeStamp });

        const root = this.ref.current!.parentElement!;
        root.setPointerCapture(pointerId);

        let { clientX, clientY } = ev;

        if (this.pointers.size === 2) {
            const [a, b] = this.pointers.values();
            this.pointerDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        }

        const handlePointerMove = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            // ev.preventDefault();
            this.pointers.set(pointerId, { clientX: ev.clientX, clientY: ev.clientY, timeStamp: ev.timeStamp });

            this.translateX += (ev.clientX - clientX) / this.pointers.size;
            this.translateY += (ev.clientY - clientY) / this.pointers.size;
            clientX = ev.clientX;
            clientY = ev.clientY;

            if (this.pointers.size === 2) {
                const [a, b] = this.pointers.values();
                const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                const scale = dist / this.pointerDist;
                this.pointerDist = dist;
                if (!this.lightbox.state.zooming) {
                    if (this.scale * scale > 1) {
                        this.lightbox.setState({ zooming: true });
                    }
                }
                this.pointScale(this.scale * scale, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
            }

            this.updateTransform("instant");
        }

        const handlePointerUp = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            root.releasePointerCapture(pointerId);
            this.pointers.delete(pointerId);

            root.removeEventListener("pointermove", handlePointerMove);
            root.removeEventListener("pointerup", handlePointerUp);

            if (this.pointers.size === 0) {
                if (!this.lightbox.state.zooming) {
                    if (this.translateX > window.innerWidth / 10) {
                        if (this.lightbox.selectBefore()) return;
                    } else if (this.translateX < -window.innerWidth / 10) {
                        if (this.lightbox.selectAfter()) return;
                    }
                    this.translateX = 0;
                    this.updateTransform("ease-out");
                } else {
                    if (this.scale < 1) {
                        this.lightbox.setState({ zooming: false });
                        this.scale = 1;
                        this.translateX = 0;
                        this.translateY = 0;
                        this.updateTransform("ease-in-out");
                    }
                }
            }
        }

        root.addEventListener("pointermove", handlePointerMove);
        root.addEventListener("pointerup", handlePointerUp);
    }

    pointScale(scale: number, x: number, y: number) {
        if (scale < minScale) scale = minScale;
        if (scale > maxScale) scale = maxScale;

        const centerX = window.innerWidth / 2;
        const centerY = (window.innerHeight - m[0] - m[2] - 8 - this.lightbox.thumbnailHeight - 8) / 2 + m[0];

        const px = (x - centerX - this.translateX) / this.scale;
        this.translateX -= px * (scale - this.scale);

        const py = (y - centerY - this.translateY) / this.scale;
        this.translateY -= py * (scale - this.scale);

        this.scale = scale;
    }

    handleDoubleClick = (ev: React.MouseEvent) => {
        if (this.lightbox.state.zooming) {
            this.lightbox.setState({ zooming: false });
            this.scale = 1;
            this.translateX = 0;
            this.translateY = 0;
        } else {
            this.lightbox.setState({ zooming: true });
            this.pointScale(2, ev.clientX, ev.clientY);
        }
        this.updateTransform("ease-in-out");

        // if (this.scale === 1 && this.translateX === 0 && this.translateY === 0) {
        //     this.pointScale(2, ev.clientX, ev.clientY);
        // } else {
        //     this.scale = 1;
        //     this.translateX = 0;
        //     this.translateY = 0;
        // }
        // this.updateTransform(false);
    }

    handleClick = (ev: React.MouseEvent) => {
        if (this.scale === 1) {
            if (ev.clientX > window.innerWidth / 3 * 2) {
                this.lightbox.selectAfter();
            } else if (ev.clientX < window.innerWidth / 3) {
                this.lightbox.selectBefore();
            }
        }
        // if (this.scale !== 1 || this.translateX !== 0 || this.translateY !== 0) {
        //     this.scale = 1;
        //     this.translateX = 0;
        //     this.translateY = 0;
        //     this.updateTransform(false);
        // }
    }

    //

    componentDidMount(): void {
        const root = this.ref.current!.parentElement!;
        window.addEventListener("resize", this.handleResize);
        root.addEventListener("wheel", this.handleWheel, { passive: false });
        this.updateTransform("ease-out");
    }

    componentWillUnmount(): void {
        const root = this.ref.current!.parentElement!;
        window.removeEventListener("resize", this.handleResize);
        root.removeEventListener("wheel", this.handleWheel);
    }

    componentDidUpdate(prevProps: Readonly<AccordionProps<T>>, prevState: Readonly<AccordionState<T>>, snapshot?: any): void {
        if (this.lastFocus !== this.focus) {
            this.lastFocus = this.focus;
            this.scale = 1;
            this.translateX = 0;
            this.translateY = 0;
            this.updateTransform("ease-in-out");
        } else {
            // this.updateTransform(true);
        }
    }

    render(): ReactNode {

        const index = this.lightbox.state.elements.indexOf(this.focus);
        if (index === -1) throw new Error("Focus not found in elements");

        const before = index > 0 ? this.lightbox.state.elements[index - 1] : null;
        const after = index < this.lightbox.state.elements.length - 1 ? this.lightbox.state.elements[index + 1] : null;
        const zooming = this.lightbox.state.zooming;

        const wrapperTop = m[0];
        const wrapperBottom = 8 + this.lightbox.thumbnailHeight + 8;

        const elementTop = m[0];
        const elementBottom = 8 + this.lightbox.thumbnailHeight + 8 + m[2];

        const elementWidth = window.innerWidth - m[1] * 2;
        const elementHeight = window.innerHeight - m[0] - m[2] - 8 - this.lightbox.thumbnailHeight - 8;

        return <>
            <div className={classes.elementWrapper} onPointerDown={this.handlePointerDown} onDoubleClick={this.handleDoubleClick} onClick={this.handleClick} style={{ top: wrapperTop, bottom: wrapperBottom }}>
                {[
                    before !== null && !zooming && <div key={objectKey(before)} className={clsx(classes.element, "element-before")} ref={this.refBefore} style={{ top: elementTop, bottom: elementBottom }}>
                        {this.adapter.renderElement(before, { onLoad: () => { }, width: elementWidth, height: elementHeight })}
                    </div>,
                    <div key={objectKey(this.focus)} className={classes.element} ref={this.ref} style={{ bottom: elementBottom }}>
                        {this.adapter.renderElement(this.focus, { onLoad: () => { }, width: elementWidth, height: elementHeight })}
                    </div>,
                    after !== null && !zooming && <div key={objectKey(after)} className={clsx(classes.element, "element-after")} ref={this.refAfter} style={{ top: elementTop, bottom: elementBottom }}>
                        {this.adapter.renderElement(after, { onLoad: () => { }, width: elementWidth, height: elementHeight })}
                    </div>
                ]}
            </div>
        </>;
    }
}


////////////////////////////////////////////////////////////////////////////////


interface ThumbnailBarProps<T> {
    lightbox: Lightbox<T>,
}

type ThumbnailBarState<T> = {}

class ThumbnailBar<T> extends Component<ThumbnailBarProps<T>, ThumbnailBarState<T>> {

    ref = createRef<HTMLDivElement>();

    scrollOffset = 0;
    scrolling = false;
    placementOffset = 0;
    placementWidth = 0;
    firstElement: T;
    lastFocus: T;
    windowWidth = window.innerWidth;

    get lightbox() {
        return this.props.lightbox;
    }

    get adapter() {
        return this.lightbox.adapter;
    }

    get focus() {
        return this.props.lightbox.props.focus;
    }

    get thumbnailHeight() {
        return this.props.lightbox.props.thumbnailHeight ?? defaultThumbnailHeight;
    }

    constructor(props: ThumbnailBarProps<T>) {
        super(props);
        this.state = {};
        this.firstElement = this.focus;
        this.lastFocus = this.focus;
    }

    updateScrolling = (easing: "ease-out" | "instant") => {
        if (!this.ref.current) return;

        const maxOffset = 100 - this.placementOffset;
        const minOffset = window.innerWidth - 100 - this.placementWidth - this.placementOffset;
        if (maxOffset < minOffset) {
            this.scrollOffset = (maxOffset + minOffset) / 2;
        } else {
            if (this.scrollOffset > maxOffset) this.scrollOffset = maxOffset;
            if (this.scrollOffset < minOffset) this.scrollOffset = minOffset;
        }

        const container = this.ref.current.firstChild as HTMLElement;
        const animation = container.animate([
            { transform: `translateX(${this.scrollOffset}px)` }
        ], {
            duration: easing === "instant" ? 0 : duration.standard,
            easing: easing === "instant" ? undefined : easing,
            fill: "both",
        });
        animation.onfinish = () => {
            container.style.transform = `translateX(${this.scrollOffset}px)`;
        }
    }

    updatePlacement = () => {
        if (!this.ref.current) return;
        if (this.lightbox.state.elements.length === 0) return;

        const i = this.lightbox.state.elements.indexOf(this.firstElement!);
        if (i === -1) throw new Error("First element not found in thumbnails");

        let x = 0;
        const container = this.ref.current.firstChild as HTMLElement;

        let child = container.firstChild as HTMLElement;
        for (let j = 0; j < i; j++) {
            x -= child.offsetWidth + 8;
            // this.placementOffset -= child.offsetWidth + 8;
            child = child.nextSibling as HTMLElement;
        }

        this.placementOffset = x;

        // let x = this.placementOffset;
        for (const child of container.children) {
            const thumb = child as HTMLElement;
            thumb.style.transform = `translateX(${x}px)`;
            x += thumb.offsetWidth + 8;
        }

        this.placementWidth = x - 8 - this.placementOffset;
    }

    maybeLoadMore = () => {
        if (this.scrollOffset + this.placementOffset > 0) {
            this.lightbox.loadElementsBefore();
        }
        if (this.scrollOffset + this.placementOffset + this.placementWidth < window.innerWidth) {
            this.lightbox.loadElementsAfter();
        }
    }

    //

    handleWheel = (ev: WheelEvent) => {
        ev.preventDefault();
        this.scrollOffset -= ev.deltaY;
        this.updateScrolling("ease-out");
        this.maybeLoadMore();
    }

    handleClick = (ev: React.MouseEvent, t: T) => {
        console.log("handleClick()");
        if (this.scrolling) return;
        this.lightbox.props.onFocusChange(t);
    }

    handlePointerDown = (ev: React.PointerEvent) => {
        const { pointerId } = ev;
        const root = this.ref.current!;
        // root.setPointerCapture(pointerId);

        let { clientX, timeStamp } = ev;
        let vx = 0;

        const handlePointerMove = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;

            if (!this.scrolling) {
                if (Math.abs(ev.clientX - clientX) > 5) {
                    this.scrolling = true;
                    clientX = ev.clientX;
                }
            } else {
                this.scrollOffset += ev.clientX - clientX;
                vx = (ev.clientX - clientX) / (ev.timeStamp - timeStamp);
                clientX = ev.clientX;
                timeStamp = ev.timeStamp;
                this.updateScrolling("instant");
                this.maybeLoadMore();
            }
        }

        const handlePointerUp = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            // root.setPointerCapture(pointerId);
            root.removeEventListener("pointermove", handlePointerMove);
            root.removeEventListener("pointerup", handlePointerUp);

            if (this.scrolling) {
                this.updateScrolling("instant");
                this.maybeLoadMore();

                const easOutV0 = 0.42; // ease-out is "cubic-bezier(0, 0, 0.58, 1)"
                this.scrollOffset += vx * duration.standard * easOutV0;
                this.updateScrolling("ease-out");

                setTimeout(() => {
                    this.scrolling = false;
                }, duration.standard);
            }
        }

        root.addEventListener("pointermove", handlePointerMove);
        root.addEventListener("pointerup", handlePointerUp);
    }

    handleResize = (ev: UIEvent) => {
        this.scrollOffset -= (this.windowWidth - window.innerWidth) / 2;
        this.windowWidth = window.innerWidth;
        this.updateScrolling("instant");
    }

    //

    componentDidMount(): void {
        const root = this.ref.current!;
        window.addEventListener("resize", this.handleResize);
        root.addEventListener("wheel", this.handleWheel, { passive: false });

        this.updatePlacement();
        this.updateFocus("instant");
        this.maybeLoadMore();
    }

    componentWillUnmount(): void {
        const root = this.ref.current!;
        window.removeEventListener("resize", this.handleResize);
        root.removeEventListener("wheel", this.handleWheel);
    }

    updateFocus(easing: "instant" | "ease-out") {
        const index = this.lightbox.state.elements.indexOf(this.focus);
        if (index === -1) throw new Error("Focus not found in thumbnails");
        const container = this.ref.current!.firstChild as HTMLElement;

        let child = container.firstChild as HTMLElement;
        let x = this.placementOffset;
        for (let i = 0; i < index; i++) {
            x += child.offsetWidth + 8;
            child = child.nextSibling as HTMLElement;
        }

        this.scrollOffset = window.innerWidth / 2 - x - child.offsetWidth / 2;
        this.updateScrolling(easing);
    }

    componentDidUpdate(prevProps: Readonly<ThumbnailBarProps<T>>, prevState: Readonly<ThumbnailBarState<T>>, snapshot?: any): void {
        this.updatePlacement();
        if (this.lastFocus !== this.focus) {
            this.lastFocus = this.focus;
            this.updateFocus("ease-out");
        }
        this.maybeLoadMore();
    }

    //

    render(): ReactNode {
        const zooming = this.lightbox.state.zooming;
        const thumbnailHeight = this.thumbnailHeight;
        const thumbnailWidth = thumbnailHeight * 21 / 9;
        const height = 8 + thumbnailHeight + 8;

        return (
            <div className={clsx(classes.thumbnails, zooming && classes.thumbnailsZooming)} ref={this.ref} style={{ height }}>
                <div className={classes.thumbnailContainer} style={{ height }}>
                    {this.lightbox.state.elements.map((t) => (
                        <div key={objectKey(t)} className={clsx(classes.thumbnail, this.focus === t && classes.thumbnailFocus)} onClick={ev => this.handleClick(ev, t)} onPointerDown={this.handlePointerDown}>
                            <div className={classes.thumbnailWrapper}>
                                {this.adapter.renderThumbnail(t, { width: thumbnailWidth, height: thumbnailHeight, onLoad: () => { } })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}

////////////////////////////////////////////////////////////////////////////////

let keyIndex = 0;
const weakKeys = new WeakMap<any, Key>();

function objectKey(obj: any): Key {
    if (typeof obj === "string" || typeof obj === "number" || typeof obj === "bigint") return obj;
    if (typeof obj === "symbol") return obj.toString();
    if (typeof obj === "boolean") return obj ? "_true" : "_false";
    if (obj === null) return "_null";
    if (obj === undefined) return "_undefined";
    let key = weakKeys.get(obj);
    if (key === undefined) {
        key = keyIndex++;
        weakKeys.set(obj, key);
    }
    return "_" + key;
}
