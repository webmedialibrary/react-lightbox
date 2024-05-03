import clsx from "clsx";
import { create } from "jss";
import preset from "jss-preset-default";
import { Component, Key, ReactElement, ReactNode, RefObject, createRef } from "react";
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
        // backgroundColor: "rgba(0, 0, 0, 0.8)",
        // opacity: 0,
        // transition: `opacity ${duration.leavingScreen}ms`,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
        cursor: "pointer",
        backgroundColor: "transparent",
        transition: `background-color ${duration.standard}ms`,
    },
    lightboxZooming: {
        cursor: "grab",
    },
    lightboxReady: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        transition: `background-color ${duration.complex}ms`,
        // opacity: 1,
        // transition: `opacity ${duration.enteringScreen}ms`,
    },
    iconButton: {
        padding: 4,
        border: "none",
        background: "none",
        cursor: "pointer",
        fill: "#d7d7d7",
        backgroundColor: "#202020c9",
        transition: `background-color ${duration.standard}ms`,
        "&:hover": {
            backgroundColor: "#151515c9",
        },
    },
    closeButton: {
        position: "fixed",
        top: 8,
        right: 8,
    },
    navigateNextButton: {
        position: "fixed",
        top: `calc(50% - 64px)`,
        right: 40,
        padding: 8,
        opacity: 1,
        transform: "none",
        transition: `opacity ease-out ${duration.shorter}ms 200ms, transform ease-out ${duration.standard}ms 200ms`,
    },
    navigateNextButtonZooming: {
        transform: "translateX(20px)",
        opacity: 0,
        pointerEvents: "none",
        transition: `opacity ease-in ${duration.standard}ms, transform ease-in ${duration.standard}ms`,
    },
    navigateBeforeButton: {
        position: "fixed",
        top: `calc(50% - 64px)`,
        left: 40,
        padding: 8,
        opacity: 1,
        transform: "none",
        transition: `opacity ease-out ${duration.shorter}ms 200ms, transform ease-out ${duration.standard}ms 200ms`,
    },
    navigateBeforeButtonZooming: {
        transform: "translateX(-20px)",
        opacity: 0,
        pointerEvents: "none",
        transition: `opacity ease-in ${duration.standard}ms, transform ease-in ${duration.standard}ms`,
    },
    thumbnails: {
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 196,
        boxSizing: "border-box",
        transition: `opacity ease-out ${duration.shorter}ms, transform ease-out ${duration.standard}ms`,
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
    onLoad: (ev: React.SyntheticEvent<HTMLElement>) => void,
}

export interface LightboxAdapter<Type> {
    renderElement: (element: Type, props: ElementProps) => ReactElement,
    renderThumbnail: (element: Type, props: ElementProps) => ReactElement,
    renderHeading: (element: Type) => ReactNode,
    loadElementsBefore: (element: Type) => Promise<Type[]>,
    loadElementsNext: (element: Type) => Promise<Type[]>,
}

export interface LightboxProps<Type> {
    adapter: LightboxAdapter<Type>,
    open: boolean,
    onClose: () => void,
    focus: Type,
    focusRef?: RefObject<HTMLElement>,
    onFocusChange: (focus: Type) => void,
    thumbnailHeight?: number,
}

const defaultThumbnailHeight = 180;

interface LightboxState<Type> {
    loadingBefore: boolean,
    loadingNext: boolean,
    ready: boolean,
    zooming: boolean,
    elements: Type[],
}

export class Lightbox<Type> extends Component<LightboxProps<Type>, LightboxState<Type>> {

    ref = createRef<HTMLDivElement>();

    constructor(props: LightboxProps<Type>) {
        super(props);
        this.state = {
            loadingBefore: false,
            loadingNext: false,
            ready: false,
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

    loadingNext = false;
    hasMoreNext = true;

    loadElementsNext() {
        if (this.loadingNext || !this.hasMoreNext) return;
        this.loadingNext = true;
        this.setState({ loadingNext: true });
        this.props.adapter.loadElementsNext(this.state.elements[this.state.elements.length - 1]).then(n => {
            this.loadingNext = false;
            this.hasMoreNext = n.length > 0;
            this.setState(state => ({
                ...state,
                loadingNext: false,
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

    selectNext() {
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
                loadingNext: false,
                loadingBefore: false,
            });
            return;
        }
    }

    componentDidMount(): void {
        window.addEventListener("keydown", this.handleKeyDown);

    }

    componentDidUpdate(prevProps: Readonly<LightboxProps<Type>>, prevState: Readonly<LightboxState<Type>>, snapshot?: any): void {
        if (!this.props.open && this.state.ready) {
            this.setState({ ready: false });
        }
        this.refreshElements();
    }

    componentWillUnmount(): void {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    handleExiting?: () => void;

    render(): ReactNode {
        const index = this.state.elements.indexOf(this.props.focus);
        if (index === -1) throw new Error("Focus not found in elements");

        const isTouchDevice = navigator.maxTouchPoints !== 0;

        const { adapter, open, onClose, focus, onFocusChange } = this.props;
        return <Transition in={open} timeout={{ appear: duration.enteringScreen, enter: duration.enteringScreen, exit: duration.leavingScreen }} nodeRef={this.ref} mountOnEnter unmountOnExit onExiting={() => this.handleExiting?.()}>
            <Transition in={this.state.ready} timeout={duration.complex} nodeRef={this.ref}>
                {state => (
                    <div className={clsx("lightbox", classes.lightbox, (state === "entered" || state === "entering") && classes.lightboxReady, this.state.zooming && classes.lightboxZooming)} ref={this.ref}>
                        <ThumbnailBar lightbox={this} />

                        <Accordion lightbox={this} />

                        <CloseButton onClick={onClose} />

                        {!isTouchDevice && <NavigateNextButton onClick={() => this.selectNext()} zooming={this.state.zooming} />}
                        {!isTouchDevice && <NavigateBeforeButton onClick={() => this.selectBefore()} zooming={this.state.zooming} />}

                        <h1 className={classes.heading}>{this.adapter.renderHeading(this.focus)}</h1>
                    </div>
                )}
            </Transition>
        </Transition>;

        // return <Transition in={open} timeout={{ appear: duration.enteringScreen, enter: duration.enteringScreen, exit: duration.leavingScreen }} nodeRef={this.ref} mountOnEnter unmountOnExit>
        //     {state => (
        //         <div className={clsx("lightbox", classes.lightbox, (state === "entered" || state === "entering") && classes.lightboxReady, this.state.zooming && classes.lightboxZooming)} ref={this.ref}>
        //             <ThumbnailBar lightbox={this} />

        //             <Accordion lightbox={this} />

        //             <CloseButton onClick={onClose} />

        //             <NavigateNextButton onClick={() => this.selectNext()} zooming={this.state.zooming} />
        //             <NavigateBeforeButton onClick={() => this.selectBefore()} zooming={this.state.zooming} />

        //             <h1 className={classes.heading}>{this.adapter.renderHeading(this.focus)}</h1>
        //         </div>
        //     )}
        // </Transition>
    }
}

////////////////////////////////////////////////////////////////////////////////


interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

function CloseButton(props: CloseButtonProps) {
    return (
        <button className={clsx(classes.iconButton, classes.closeButton)} {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 -960 960 960" width="40" className={classes.svgIcon}>
                <path d="m251.333-204.667-46.666-46.666L433.334-480 204.667-708.667l46.666-46.666L480-526.666l228.667-228.667 46.666 46.666L526.666-480l228.667 228.667-46.666 46.666L480-433.334 251.333-204.667Z" />
            </svg>
        </button>
    )
}


interface NavigateNextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    zooming: boolean,
}

function NavigateNextButton(props: NavigateNextButtonProps) {
    const { zooming } = props;

    return (
        <button className={clsx(classes.iconButton, classes.navigateNextButton, zooming && classes.navigateNextButtonZooming)} {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 -960 960 960" width="40" className={classes.svgIcon}>
                <path d="M521.33-480.67 328-674l47.33-47.33L616-480.67 375.33-240 328-287.33l193.33-193.34Z" />
            </svg>
        </button>
    )
}


interface NavigateBeforeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    zooming: boolean,
}

function NavigateBeforeButton(props: NavigateBeforeButtonProps) {
    const { zooming } = props;

    return (
        <button className={clsx(classes.iconButton, classes.navigateBeforeButton, zooming && classes.navigateBeforeButtonZooming)} {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 -960 960 960" width="40" className={classes.svgIcon}>
                <path d="M560.67-240 320-480.67l240.67-240.66L608-674 414.67-480.67 608-287.33 560.67-240Z" />
            </svg>
        </button>
    )
}



////////////////////////////////////////////////////////////////////////////////


interface AccordionProps<T> {
    lightbox: Lightbox<T>,
}

interface AccordionState<T> {
    ready: boolean,
}

const maxScale = 3;
const minScale = 0.5;

class Accordion<T> extends Component<AccordionProps<T>, AccordionState<T>> {

    lastFocus: T;

    constructor(props: AccordionProps<T>) {
        super(props);
        this.lastFocus = this.focus;
        this.state = {
            ready: true
        };
        this.lightbox.handleExiting = () => this.handleExiting();
    }

    ref = createRef<HTMLDivElement>();
    refBefore = createRef<HTMLDivElement>();
    refNext = createRef<HTMLDivElement>();

    touchAction: "none" | "pinch-zoom" | "pan" = "none";

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

        const elementNext = this.refNext.current as HTMLElement | null;
        if (elementNext) {
            if (this.translateX > 0 || this.scale < 1) elementNext.style.visibility = "hidden";
            if (this.translateX < 0 && this.scale == 1) elementNext.style.visibility = "visible";
            const imageNext = elementNext.firstChild as HTMLElement;
            const x = this.translateX + window.innerWidth - (window.innerWidth - imageNext.offsetWidth) / 2;
            const animation = elementNext.animate([
                { transform: `translate(${x}px` }
            ], {
                duration: easing === "instant" ? 0 : duration.standard,
                easing: easing === "instant" ? undefined : easing,
                fill: "both",
            });
            animation.onfinish = () => {
                elementNext.style.transform = `translate(${x}px`;
            }
        }


        const elementBefore = this.refBefore.current as HTMLElement | null;
        if (elementBefore) {
            if (this.translateX < 0 || this.scale < 1) elementBefore.style.visibility = "hidden";
            if (this.translateX > 0 && this.scale == 1) elementBefore.style.visibility = "visible";
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

            if (ev.pointerType === "mouse" && this.scale > 1) {
                root.closest<HTMLElement>(`.${classes.lightbox}`)!.style.cursor = "grabbing";
            }

            if (ev.pointerType === "touch" || this.scale > 1) {
                this.translateX += (ev.clientX - clientX) / this.pointers.size;
                this.translateY += (ev.clientY - clientY) / this.pointers.size;
            }
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
            // ev.preventDefault();

            root.removeEventListener("pointermove", handlePointerMove);
            root.removeEventListener("pointerup", handlePointerUp);

            if (this.pointers.size === 0) {
                root.closest<HTMLElement>(`.${classes.lightbox}`)!.style.cursor = "";

                if (!this.lightbox.state.zooming) {
                    if (ev.pointerType === "touch") {
                        if (this.translateX > window.innerWidth / 10) {
                            if (this.lightbox.selectBefore()) return;
                        } else if (this.translateX < -window.innerWidth / 10) {
                            if (this.lightbox.selectNext()) return;
                        }
                        this.translateX = 0;
                        this.updateTransform("ease-out");
                    }
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

    handleClick = (ev: React.MouseEvent) => {
        console.log("handleClick()")
        if (this.scale === 1) {
            if (ev.clientX > window.innerWidth / 3 * 2) {
                this.lightbox.selectNext();
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

    handleDoubleClick = (ev: React.MouseEvent) => {
        console.log("handleDoubleClick()");
        if (this.scale !== 1) {
            this.lightbox.setState({ zooming: false });
            this.scale = 1;
            this.translateX = 0;
            this.translateY = 0;
            this.updateTransform("ease-in-out");
        } else {
            if (ev.clientX > window.innerWidth / 3 && ev.clientX < window.innerWidth / 3 * 2) {
                this.lightbox.setState({ zooming: true });
                this.pointScale(2, ev.clientX, ev.clientY);
                this.updateTransform("ease-in-out");
            }
        }
        // if (this.scale === 1 && this.translateX === 0 && this.translateY === 0) {
        //     this.pointScale(2, ev.clientX, ev.clientY);
        // } else {
        //     this.scale = 1;
        //     this.translateX = 0;
        //     this.translateY = 0;
        // }
        // this.updateTransform(false);
    }

    ready = true;

    handleElementLoad = (ev: React.SyntheticEvent<HTMLElement>) => {
        const target = ev.target as HTMLElement;
        if (!this.ready) return;
        this.ready = false;
        this.setState({ ready: false });
        const source = this.lightbox.props.focusRef?.current;
        if (!source) return;
        const targetRect = target.getBoundingClientRect();
        const sourceRect = source.getBoundingClientRect();

        const dx = sourceRect.left + sourceRect.width / 2 - targetRect.left - targetRect.width / 2;
        const dy = sourceRect.top + sourceRect.height / 2 - targetRect.top - targetRect.height / 2;
        const sx = sourceRect.width / targetRect.width;
        const sy = sourceRect.height / targetRect.height;

        this.lightbox.setState({ ready: true });

        this.ref.current!.style.opacity = "1";

        target.animate([
            { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
            { transform: "none" }
        ], {
            duration: duration.complex,
            easing: "ease-out",
            fill: "both",
        });
    }

    handleExiting = () => {
        const target = this.lightbox.props.focusRef?.current;
        if (!target) return;

        const source = this.ref.current!.firstChild as HTMLElement;
        if (!source) return;

        const targetRect = target.getBoundingClientRect();
        const sourceRect = source.getBoundingClientRect();

        const dx = targetRect.left + targetRect.width / 2 - sourceRect.left - sourceRect.width / 2;
        const dy = targetRect.top + targetRect.height / 2 - sourceRect.top - sourceRect.height / 2;
        const sx = targetRect.width / sourceRect.width;
        const sy = targetRect.height / sourceRect.height;

        source.animate([
            { transform: "none" },
            { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }
        ], {
            duration: duration.short,
            easing: "ease-out",
            fill: "both",
        });
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
            this.updateTransform("ease-out");
        } else {
            // this.updateTransform(true);
        }
    }

    render(): ReactNode {

        const index = this.lightbox.state.elements.indexOf(this.focus);
        if (index === -1) throw new Error("Focus not found in elements");

        const before = index > 0 ? this.lightbox.state.elements[index - 1] : null;
        const next = index < this.lightbox.state.elements.length - 1 ? this.lightbox.state.elements[index + 1] : null;
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
                    <div key={objectKey(this.focus)} className={classes.element} ref={this.ref} style={{ bottom: elementBottom, opacity: this.state.ready ? 0 : 1 }}>
                        {this.adapter.renderElement(this.focus, { onLoad: this.handleElementLoad, width: elementWidth, height: elementHeight })}
                    </div>,
                    next !== null && !zooming && <div key={objectKey(next)} className={clsx(classes.element, "element-next")} ref={this.refNext} style={{ top: elementTop, bottom: elementBottom }}>
                        {this.adapter.renderElement(next, { onLoad: () => { }, width: elementWidth, height: elementHeight })}
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
            this.lightbox.loadElementsNext();
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
