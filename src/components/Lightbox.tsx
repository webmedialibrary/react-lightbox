import clsx from "clsx";
import { create } from "jss";
import preset from "jss-preset-default";
import { Component, Key, ReactElement, ReactNode, createRef } from "react";
import { Transition } from "react-transition-group";

const jss = create(preset());

const styles = {
    lightbox: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        opacity: 0,
        transition: "opacity 300ms",
        userSelect: "none",
    },
    lightboxOpen: {
        opacity: 1,
    },
    closeButton: {
        position: "fixed",
        top: 16,
        right: 16,
        padding: 8,
        border: "none",
        background: "none",
        cursor: "pointer",
        fill: "#d7d7d7",
        borderRadius: "50%",
        backgroundColor: "rgba(45, 45, 45, 0.5)",
        transition: "background-color 300ms",
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
        transition: "opacity ease-out 200ms 150ms, transform  ease-out 300ms 150ms",
    },
    thumbnailsZooming: {
        opacity: 0,
        transform: "translateY(40px)",
        transition: "opacity ease-in 300ms, transform  ease-in 300ms",
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
        transition: "opacity 150ms",
    },
    thumbnailFocus: {
        boxShadow: "0 0 10px 2px #2486ffe6",
        background: "#2486ffe6",
        "&> $thumbnailWrapper": {
            opacity: .6
        }
    },
    thumbnailWrapper: {},
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
        top: 80,
        left: 0,
        width: "100%",
        boxSizing: "border-box",
        padding: "0 32px",
        bottom: 220,
        // display: "flex",
        justifyContent: "center",
        alignItems: "center",
        display: "none",
    },
    heading: {
        margin: 0,
        padding: "16px 80px",
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
}

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
        return <Transition in={open} timeout={300} nodeRef={this.ref} mountOnEnter unmountOnExit>
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

    handleWheel = (ev: React.WheelEvent) => {
        const scale = this.scale - ev.deltaY / 1000;

        if (!this.lightbox.state.zooming) {
            if (scale > 1) {
                this.lightbox.setState({ zooming: true });
            }
        }

        // if (this.lightbox.state.zooming) {
        this.pointScale(scale, ev.pageX, ev.pageY);
        this.updateTransform(false);
        if (this.zoomResetTimeout) clearTimeout(this.zoomResetTimeout);
        this.zoomResetTimeout = setTimeout(() => {
            if (this.scale <= 1) {
                this.lightbox.setState({ zooming: false });
                this.zoomResetTimeout = null;
                this.scale = 1;
                this.translateX = 0;
                this.translateY = 0;
                this.updateTransform(false);
            }
        }, 300);
        // } else {

        // }
    }

    updateTransform = (instant: boolean) => {
        const element = this.ref.current! as HTMLElement;
        // const image = element.firstChild as HTMLElement;

        if (this.scale < minScale) this.scale = minScale;
        if (this.scale > maxScale) this.scale = maxScale;

        if (this.scale <= 1) {
            this.translateY = 0;
        }
        // const imageWidth = image.offsetWidth, imageHeight = image.offsetHeight;
        // const minTranslateY = - (window.innerHeight - 300) / 2 + imageHeight * this.scale / 2;
        // console.log("minTranslateY", minTranslateY);

        // if(minTranslateY < 0) {
        //     this.translateY = 0;
        // } else {
        //     // if (this.translateY < minTranslateY) this.translateY = minTranslateY;
        //     // if (this.translateY > -minTranslateY) this.translateY = -minTranslateY;
        // }



        element.style.display = "flex";
        const animation = element.animate([
            { transform: `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})` }
        ], {
            duration: instant ? undefined : 300,
            easing: "ease-out",
            fill: "both",
        });
        animation.onfinish = () => {
            element.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        }

        const elementAfter = this.refAfter.current as HTMLElement | null;
        if (elementAfter) {
            // elementAfter.style.display = this.translateX <= 0 ? "flex" : "none";
            if (this.translateX > 0) elementAfter.style.display = "none";
            if (this.translateX < 0) elementAfter.style.display = "flex";
            const imageAfter = elementAfter.firstChild as HTMLElement;
            const x = this.translateX + window.innerWidth - (window.innerWidth - imageAfter.offsetWidth) / 2;
            const animation = elementAfter.animate([
                { transform: `translate(${x}px` }
            ], {
                duration: instant ? undefined : 300,
                easing: "ease-out",
                fill: "both",
            });
            animation.onfinish = () => {
                elementAfter.style.transform = `translate(${x}px`;
            }
        }


        const elementBefore = this.refBefore.current as HTMLElement | null;
        if (elementBefore) {
            if (this.translateX > 0) elementBefore.style.display = "flex";
            if (this.translateX < 0) elementBefore.style.display = "none";
            // elementBefore.style.display = this.translateX >= 0 ? "flex" : "none";
            const imageBefore = elementBefore.firstChild as HTMLElement;
            const x = this.translateX - window.innerWidth + (window.innerWidth - imageBefore.offsetWidth) / 2;
            const animation = elementBefore.animate([
                { transform: `translate(${x}px` }
            ], {
                duration: instant ? undefined : 300,
                easing: "ease-out",
                fill: "both",
            });
            animation.onfinish = () => {
                elementBefore.style.transform = `translate(${x}px`;
            }
        }
    }

    handlePointerDown = (ev: React.PointerEvent) => {
        const { pointerId } = ev;
        let { screenX, screenY } = ev;
        // ev.preventDefault();

        const handlePointerMove = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            this.translateX += ev.screenX - screenX;
            this.translateY += ev.screenY - screenY;
            screenX = ev.screenX;
            screenY = ev.screenY;
            this.updateTransform(true);
        }

        const handlePointerUp = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);

            if (!this.lightbox.state.zooming) {
                if (this.translateX > window.innerWidth / 10) {
                    const index = this.lightbox.state.elements.indexOf(this.focus);
                    if (index > 0) this.lightbox.props.onFocusChange(this.lightbox.state.elements[index - 1]);
                } else if (this.translateX < -window.innerWidth / 10) {
                    const index = this.lightbox.state.elements.indexOf(this.focus);
                    if (index < this.lightbox.state.elements.length - 1) this.lightbox.props.onFocusChange(this.lightbox.state.elements[index + 1]);
                } else {
                    this.translateX = 0;
                    this.updateTransform(false);
                }
            }

            // this.translateX = -window.innerWidth;
            // this.updateTransform(false);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    }

    pointScale(scale: number, x: number, y: number) {
        if (scale < minScale) scale = minScale;
        if (scale > maxScale) scale = maxScale;

        const centerX = window.innerWidth / 2;
        const centerY = (window.innerHeight - 300) / 2 + 80;

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
            this.pointScale(2, ev.pageX, ev.pageY);
        }
        this.updateTransform(false);

        // if (this.scale === 1 && this.translateX === 0 && this.translateY === 0) {
        //     this.pointScale(2, ev.pageX, ev.pageY);
        // } else {
        //     this.scale = 1;
        //     this.translateX = 0;
        //     this.translateY = 0;
        // }
        // this.updateTransform(false);
    }

    handleClick = (ev: React.MouseEvent) => {
        // if (this.scale !== 1 || this.translateX !== 0 || this.translateY !== 0) {
        //     this.scale = 1;
        //     this.translateX = 0;
        //     this.translateY = 0;
        //     this.updateTransform(false);
        // }
    }

    //

    componentDidMount(): void {
        window.addEventListener("resize", this.handleResize);
        this.updateTransform(true);
    }

    componentWillUnmount(): void {
        window.removeEventListener("resize", this.handleResize);
    }

    componentDidUpdate(prevProps: Readonly<AccordionProps<T>>, prevState: Readonly<AccordionState<T>>, snapshot?: any): void {
        if (this.lastFocus !== this.focus) {
            this.lastFocus = this.focus;
            this.scale = 1;
            this.translateX = 0;
            this.translateY = 0;
            this.updateTransform(false);
        } else {
            // this.updateTransform(true);
        }
    }

    render(): ReactNode {

        const width = window.innerWidth - 64;
        const height = window.innerHeight - 300;

        const index = this.lightbox.state.elements.indexOf(this.focus);
        if (index === -1) throw new Error("Focus not found in elements");

        const before = index > 0 ? this.lightbox.state.elements[index - 1] : null;
        const after = index < this.lightbox.state.elements.length - 1 ? this.lightbox.state.elements[index + 1] : null;
        const zooming = this.lightbox.state.zooming;

        return <>
            {/* {before !== null && (

            )} */}
            <div className={classes.elementWrapper} onWheel={this.handleWheel} onPointerDown={this.handlePointerDown} onDoubleClick={this.handleDoubleClick} onClick={this.handleClick}>
                {[
                    before !== null && !zooming && <div key={objectKey(before)} className={clsx(classes.element, "element-before")} ref={this.refBefore}>
                        {this.adapter.renderElement(before, { onLoad: () => { }, width, height })}
                    </div>,
                    <div key={objectKey(this.focus)} className={classes.element} ref={this.ref}>
                        {this.adapter.renderElement(this.focus, { onLoad: () => { }, width, height })}
                    </div>,
                    after !== null && !zooming && <div key={objectKey(after)} className={clsx(classes.element, "element-after")} ref={this.refAfter}>
                        {this.adapter.renderElement(after, { onLoad: () => { }, width, height })}
                    </div>
                ]}
            </div>
        </>;
    }
}


////////////////////////////////////////////////////////////////////////////////


interface ThumbnailBarProps<T> {
    // adapter: LightboxAdapter<T>,
    lightbox: Lightbox<T>,
}

type ThumbnailBarState<T> = {
    // thumbnails: T[],
    // thumbnailNodes: ReactNode[],
    // loadingBefore: boolean,
    // loadingAfter: boolean,
}

class ThumbnailBar<T> extends Component<ThumbnailBarProps<T>, ThumbnailBarState<T>> {

    ref = createRef<HTMLDivElement>();

    // hasMoreBefore = true;
    // loadingBefore = false;
    // hasMoreAfter = true;
    // loadingAfter = false;
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

    constructor(props: ThumbnailBarProps<T>) {
        super(props);
        this.state = {
            thumbnails: [this.focus],
            thumbnailNodes: [this.adapter.renderThumbnail(this.focus, { width: 180, height: 180, onLoad: () => { } })],
            loadingBefore: false,
            loadingAfter: false,
        };
        this.firstElement = this.focus;
        this.lastFocus = this.focus;
    }

    updateScrolling = (instant: boolean) => {
        if (!this.ref.current) return;

        const maxOffset = 100 - this.placementOffset;
        const minOffset = window.innerWidth - 100 - this.placementWidth - this.placementOffset;
        console.log("updateScrolling", { minOffset, scrollOffset: this.scrollOffset, maxOffset })
        if (maxOffset < minOffset) {
            this.scrollOffset = (maxOffset + minOffset) / 2;
        } else {
            if (this.scrollOffset > maxOffset) this.scrollOffset = maxOffset;
            if (this.scrollOffset < minOffset) this.scrollOffset = minOffset;
        }

        // if (this.scrollOffset + this.placementOffset > 100) this.scrollOffset = 100 - this.placementOffset;
        // if (this.scrollOffset + this.placementOffset + this.placementWidth < window.innerWidth - 100) this.scrollOffset = window.innerWidth - 100 - this.placementWidth - this.placementOffset;

        // console.log({ scrollOffset: this.scrollOffset, placementOffset: this.placementOffset })


        const container = this.ref.current.firstChild as HTMLElement;
        const animation = container.animate([
            // { transform: container.style.transform },
            { transform: `translateX(${this.scrollOffset}px)` }
        ], {
            duration: instant ? undefined : 300,
            easing: "ease-out",
            fill: "both",
            // fill: "forwards",
            // composite: "add"
        });
        animation.onfinish = () => {
            // console.log("animation finish", container.style.transform);
            container.style.transform = `translateX(${this.scrollOffset}px)`;
        }
        // animation.commitStyles();
        // container.style.transform = `translateX(${this.scrollOffset}px)`;
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
        console.log("updatePlacement", { length: this.lightbox.state.elements.length, index: i, placementOffset: this.placementOffset, placementWidth: this.placementWidth })
    }

    maybeLoadMore = () => {
        if (this.scrollOffset + this.placementOffset > 0) {
            this.lightbox.loadElementsBefore();
            // if (!this.loadingBefore && this.hasMoreBefore) {
            //     this.loadingBefore = true;
            //     this.setState({ loadingBefore: true });
            //     this.props.adapter.loadElementsBefore(this.state.thumbnails[0]).then(elements => {
            //         this.loadingBefore = false;
            //         this.hasMoreBefore = elements.length > 0;
            //         this.setState(state => ({
            //             ...state,
            //             loadingBefore: false,
            //             thumbnails: [...elements, ...state.thumbnails],
            //             thumbnailNodes: [...elements.map(t => this.props.adapter.renderThumbnail(t, { onLoad: () => { }, width: 180, height: 180 })), ...state.thumbnailNodes],
            //         }));
            //     });
            // }
        }
        if (this.scrollOffset + this.placementOffset + this.placementWidth < window.innerWidth) {
            this.lightbox.loadElementsAfter();
            // if (!this.loadingAfter && this.hasMoreAfter) {
            //     this.loadingAfter = true;
            //     this.setState({ loadingAfter: true });
            //     this.props.adapter.loadElementsAfter(this.state.thumbnails[this.state.thumbnails.length - 1]).then(elements => {
            //         this.loadingAfter = false;
            //         this.hasMoreAfter = elements.length > 0;
            //         this.setState(state => ({
            //             ...state,
            //             loadingAfter: false,
            //             thumbnails: [...state.thumbnails, ...elements],
            //             thumbnailNodes: [...state.thumbnailNodes, ...elements.map(t => this.props.adapter.renderThumbnail(t, { onLoad: () => { }, width: 180, height: 180 }))],
            //         }));
            //     });
            // }
        }
    }

    //

    handleWheel = (ev: React.WheelEvent) => {
        this.scrollOffset -= ev.deltaY;
        ev.preventDefault();
        // console.log("updateTransform after wheel", false, true);
        this.updateScrolling(false);
        this.maybeLoadMore();
    }

    handleClick = (ev: React.MouseEvent, t: T) => {
        if (this.scrolling) return;
        this.lightbox.props.onFocusChange(t);
    }

    handlePointerDown = (ev: React.PointerEvent) => {
        const { pointerId } = ev;
        let { screenX } = ev;
        // ev.preventDefault();

        const handlePointerMove = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            if (!this.scrolling) {
                if (Math.abs(ev.screenX - screenX) > 5) {
                    this.scrolling = true;
                    screenX = ev.screenX;
                }
            } else {
                this.scrollOffset += ev.screenX - screenX;
                screenX = ev.screenX;
                this.updateScrolling(true);
                this.maybeLoadMore();
            }
        }

        const handlePointerUp = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);

            if (this.scrolling) {
                this.updateScrolling(true);
                this.maybeLoadMore();

                setTimeout(() => {
                    this.scrolling = false;
                }, 300);
            }
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    }

    // handleKeyDown = (ev: KeyboardEvent) => {
    //     if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
    //         ev.preventDefault();
    //         const index = this.lightbox.state.elements.indexOf(this.props.focus);
    //         if (index > 0) this.props.onFocusChange(this.lightbox.state.elements[index - 1]);
    //     } else if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
    //         ev.preventDefault();
    //         const index = this.lightbox.state.elements.indexOf(this.props.focus);
    //         if (index < this.lightbox.state.elements.length - 1) this.props.onFocusChange(this.lightbox.state.elements[index + 1]);
    //     }
    // }

    handleResize = (ev: UIEvent) => {
        this.scrollOffset -= (this.windowWidth - window.innerWidth) / 2;
        this.windowWidth = window.innerWidth;
        this.updateScrolling(true);
    }

    //

    componentDidMount(): void {
        console.log("componentDidMount()");
        // window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("resize", this.handleResize);

        // const index = this.lightbox.state.elements.indexOf(this.props.focus);
        // if (index === -1) {
        //     this.firstElement = this.props.focus;
        //     this.setState({
        //         thumbnails: [this.props.focus],
        //         thumbnailNodes: [this.adapter.renderThumbnail(this.props.focus, { onLoad: () => { }, width: 180, height: 180 })],
        //     });
        //     return;
        // }

        this.updatePlacement();
        this.updateFocus(true);
        this.maybeLoadMore();
    }

    componentWillUnmount(): void {
        console.log("componentWillUnmount()");
        // window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("resize", this.handleResize);
    }

    updateFocus(instant: boolean) {
        console.log("updateFocus()");
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
        // console.log("scrollOffset", window.innerWidth, x, child.offsetWidth, "=>", this.scrollOffset);

        // const focusChanged = this.lastFocus !== this.props.focus;
        // this.lastFocus = this.props.focus;
        // this.updateScrolling(!focusChanged);
        this.updateScrolling(instant);
        // this.maybeLoadMore();
    }

    componentDidUpdate(prevProps: Readonly<ThumbnailBarProps<T>>, prevState: Readonly<ThumbnailBarState<T>>, snapshot?: any): void {
        console.log("componentDidUpdate()");
        this.updatePlacement();
        if (this.lastFocus !== this.focus) {
            this.lastFocus = this.focus;
            this.updateFocus(false);
        }
        this.maybeLoadMore();
        // this.updateFocus();
    }

    //

    render(): ReactNode {
        // if (thumbnailNodes.length !== thumbnails.length) {
        //     throw new Error("Thumbnail nodes and thumbnails must have the same length");
        // }
        const zooming = this.lightbox.state.zooming;

        return (
            <div className={clsx(classes.thumbnails, zooming && classes.thumbnailsZooming)} ref={this.ref} onWheel={this.handleWheel} >
                <div className={classes.thumbnailContainer}>
                    {this.lightbox.state.elements.map((t) => (
                        <div key={objectKey(t)} className={clsx(classes.thumbnail, this.focus === t && classes.thumbnailFocus)} onClick={ev => this.handleClick(ev, t)} onPointerDown={this.handlePointerDown}>
                            <div className={classes.thumbnailWrapper}>
                                {this.adapter.renderThumbnail(t, { width: 180, height: 180, onLoad: () => { } })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}

// function ThumbnailBar<T>(props: ThumbnailBarProps<T>) {
//     const { adapter, focus, onFocusChange } = props;

//     const [thumbnails, setThumbnails] = useState<T[]>([]);
//     const [thumbnailNodes, setThumbnailNodes] = useState<ReactNode[]>([]);

//     // const idx = thumbnails.indexOf(focus);
//     // if (idx === -1) {
//     //     setThumbnails([focus]);
//     //     setThumbnailNodes([adapter.renderElement(focus)]);
//     //     adapter.loadElementsBefore(focus).then(elements => {
//     //         setThumbnails(thumbnails => [...elements, ...thumbnails]);
//     //         setThumbnailNodes(nodes => [...elements.map(adapter.renderElement), ...nodes]);
//     //     });
//     //     adapter.loadElementsAfter(focus).then(elements => {
//     //         setThumbnails(thumbnails => [...thumbnails, ...elements]);
//     //         setThumbnailNodes(nodes => [...nodes, ...elements.map(adapter.renderElement)]);
//     //     });
//     // }

//     const [loadingBefore, setLoadingBefore] = useState(false);
//     const [loadingAfter, setLoadingAfter] = useState(false);

//     const ref = useRef<HTMLDivElement>(null);

//     const [state] = useState<{
//         widths: number[],
//         totalWidth: number,
//         // index: number,
//         hasMoreBefore: boolean,
//         loadingBefore: boolean,
//         hasMoreAfter: boolean,
//         loadingAfter: boolean,
//         scrollOffset: number,
//         scrolling: boolean,
//         placementOffset: number,
//         firstElement: T | null,
//     }>({
//         widths: [],
//         totalWidth: 0,
//         // index: -1,
//         hasMoreBefore: true,
//         loadingBefore: false,
//         hasMoreAfter: true,
//         loadingAfter: false,
//         scrollOffset: 0,
//         scrolling: false,
//         placementOffset: 0,
//         firstElement: null,
//     });

//     useLayoutEffect(() => {
//         if (!ref.current) return;
//         const widths = new Array<number>(thumbnails.length);
//         var i = 0;
//         let totalWidth = 0;
//         for (let elm of ref.current.children) {
//             const offsetWidth = (elm as HTMLElement).offsetWidth;
//             widths[i] = offsetWidth;
//             if (i > 0) totalWidth += 8;
//             totalWidth += offsetWidth;
//             i++;
//         }
//         state.totalWidth = totalWidth;
//         state.widths = widths;
//     }, [thumbnails]);


//     // update placement 
//     useLayoutEffect(() => {
//         if (!ref.current) return;
//         if (thumbnails.length === 0) return;

//         const i = thumbnails.indexOf(state.firstElement!);
//         if (i === -1) throw new Error("First element not found in thumbnails");

//         const container = ref.current!.firstChild as HTMLElement;

//         let child = container.firstChild as HTMLElement;
//         for (let j = 0; j < i; j++) {
//             state.placementOffset -= child.offsetWidth + 8;
//             child = child.nextSibling as HTMLElement;
//         }

//         let x = state.placementOffset;
//         for (const child of container.children) {
//             const thumb = child as HTMLElement;
//             thumb.style.transform = `translateX(${x}px)`;
//             x += thumb.offsetWidth + 8;
//         }

//         maybeLoadMore();
//     }, [thumbnails]);

//     function updateScrolling(instant: boolean) {
//         if (!ref.current) return;
//         const { scrollOffset } = state;

//         const container = ref.current.firstChild as HTMLElement;
//         container.animate([
//             { transform: `translateX(${scrollOffset}px)` }
//         ], {
//             duration: instant ? undefined : 300,
//             easing: "ease-out",
//             fill: "both",
//         });
//     }

//     // function updateTransform(instant: boolean, checkBounds: boolean) {
//     //     if (!ref.current) return;
//     //     const { scrollOffset, widths, loadingBefore, hasMoreBefore, loadingAfter, hasMoreAfter } = state;

//     //     let x = scrollOffset;
//     //     // if (checkBounds) {
//     //     //     const minX = window.innerWidth / 2 - widths[0] / 2;
//     //     //     if (x > minX && !hasMoreBefore) {
//     //     //         state.scrollOffset = minX;
//     //     //         x = minX;
//     //     //     }
//     //     // }

//     //     // if (x > 0) {
//     //     //     if (!loadingBefore && hasMoreBefore) {
//     //     //         state.loadingBefore = true;
//     //     //         setLoadingBefore(true);
//     //     //         adapter.loadElementsBefore(thumbnails[0]).then(elements => {
//     //     //             setLoadingBefore(false);
//     //     //             state.loadingBefore = false;
//     //     //             if (elements.length > 0) {
//     //     //                 state.index += elements.length;
//     //     //                 setThumbnails(thumbnails => [...elements, ...thumbnails]);
//     //     //                 setThumbnailNodes(nodes => [...elements.map(adapter.renderElement), ...nodes]);
//     //     //             } else {
//     //     //                 state.hasMoreBefore = false;
//     //     //             }
//     //     //         });
//     //     //     }
//     //     // }

//     //     const container = ref.current.firstChild as HTMLElement;
//     //     container.animate([
//     //         { transform: `translateX(${x}px)` }
//     //     ], {
//     //         duration: instant ? undefined : 300,
//     //         easing: "ease-out",
//     //         fill: "both",
//     //     });

//     //     // if (x < window.innerWidth) {
//     //     //     if (!loadingAfter && hasMoreAfter) {
//     //     //         state.loadingAfter = true;
//     //     //         setLoadingAfter(true);
//     //     //         adapter.loadElementsAfter(thumbnails[thumbnails.length - 1]).then(elements => {
//     //     //             setLoadingAfter(false);
//     //     //             state.loadingAfter = false;
//     //     //             if (elements.length > 0) {
//     //     //                 setThumbnails(thumbnails => [...thumbnails, ...elements]);
//     //     //                 setThumbnailNodes(nodes => [...nodes, ...elements.map(adapter.renderElement)]);
//     //     //             } else {
//     //     //                 state.hasMoreAfter = false;
//     //     //             }
//     //     //         });
//     //     //     }
//     //     // }
//     // }

//     // center focus
//     useLayoutEffect(() => {
//         if (!ref.current) return;
//         const { widths } = state;

//         let instant = true;

//         // console.log("thumbnails", thumbnails, focus);
//         const index = thumbnails.indexOf(focus);
//         if (index === -1) {
//             // state.index = -1;
//             state.firstElement = focus;
//             setThumbnails([focus]);
//             setThumbnailNodes([adapter.renderElement(focus)]);
//             return;
//         }

//         // let scrollOffset = window.innerWidth / 2 - widths[index] / 2;
//         // for (let i = 0; i < index; i++) {
//         //     scrollOffset -= widths[i] + 8;
//         // }
//         // if (index !== state.index) instant = false;
//         // if (state.index === -1) instant = true;

//         // state.index = index;
//         // state.scrollOffset = scrollOffset;


//         // console.log("updateTransform after fucus", instant, false);
//         // updateTransform(instant, false);

//     }, [thumbnails, focus]);


//     function maybeLoadMore() {

//         const x = state.scrollOffset + state.placementOffset;
//         if (x > 0) {
//             if (!state.loadingBefore && state.hasMoreBefore) {
//                 state.loadingBefore = true;
//                 setLoadingBefore(true);
//                 adapter.loadElementsBefore(thumbnails[0]).then(elements => {
//                     setLoadingBefore(false);
//                     state.loadingBefore = false;
//                     if (elements.length > 0) {
//                         // state.index += elements.length;
//                         setThumbnails(thumbnails => [...elements, ...thumbnails]);
//                         setThumbnailNodes(nodes => [...elements.map(adapter.renderElement), ...nodes]);
//                     } else {
//                         state.hasMoreBefore = false;
//                     }
//                 });
//             }

//         }

//     }

//     function handlePointerDown(ev: React.PointerEvent) {
//         const { pointerId } = ev;
//         let { screenX } = ev;
//         // ev.preventDefault();

//         function handlePointerMove(ev: PointerEvent) {
//             if (ev.pointerId !== pointerId) return;
//             if (!state.scrolling) {
//                 if (Math.abs(ev.screenX - screenX) > 5) {
//                     state.scrolling = true;
//                     screenX = ev.screenX;
//                 }
//             } else {
//                 state.scrollOffset += ev.screenX - screenX;
//                 screenX = ev.screenX;

//                 // console.log("updateTransform after pointerMove", false, true);
//                 // updateTransform(true, false);
//                 updateScrolling(true);
//                 maybeLoadMore();
//             }
//         }

//         function handlePointerUp(ev: PointerEvent) {
//             if (ev.pointerId !== pointerId) return;
//             // ev.preventDefault();
//             window.removeEventListener("pointermove", handlePointerMove);
//             window.removeEventListener("pointerup", handlePointerUp);

//             if (state.scrolling) {
//                 // console.log("updateTransform after pointerUp", false, true);
//                 // updateTransform(false, true);
//                 updateScrolling(true);
//                 maybeLoadMore();

//                 setTimeout(() => {
//                     state.scrolling = false;
//                 }, 300);
//             }

//             // const {scrollOffset, hasMoreBefore} = state;

//             // if (!hasMoreBefore) {
//             //     let x = scrollOffset;

//             //     const minX = 16;
//             //     const maxX = window.innerWidth - state.widths[state.index] - 16;
//             //     console.log(minX, x, maxX);

//             //     if (x > minX) {
//             //         state.scrollOffset -= x - minX;
//             //         updateTransform(false);
//             //     }
//             //     // if (x < maxX) {
//             //     //     state.scrollOffset += maxX - x;
//             //     //     updateTransform(false);
//             //     // }
//             // }
//         }

//         window.addEventListener("pointermove", handlePointerMove);
//         window.addEventListener("pointerup", handlePointerUp);
//     }

//     function handleWheel(ev: React.WheelEvent) {
//         state.scrollOffset += ev.deltaY;
//         ev.preventDefault();
//         // console.log("updateTransform after wheel", false, true);
//         updateScrolling(false);
//         maybeLoadMore();
//     }

//     function handleClick(ev: React.MouseEvent, i: number) {
//         if (state.scrolling) return;
//         onFocusChange(thumbnails[i]);
//     }

//     useEffect(() => {
//         function handleKeyDown(ev: KeyboardEvent) {
//             if (state.scrolling) return;
//             if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
//                 ev.preventDefault();
//                 const index = thumbnails.indexOf(focus);
//                 if (index > 0) onFocusChange(thumbnails[index - 1]);
//             } else if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
//                 ev.preventDefault();
//                 const index = thumbnails.indexOf(focus);
//                 if (index < thumbnails.length - 1) onFocusChange(thumbnails[index + 1]);
//             }
//         }
//         window.addEventListener("keydown", handleKeyDown);
//         return () => {
//             window.removeEventListener("keydown", handleKeyDown);
//         }
//     }, [thumbnails, focus, onFocusChange]);

//     if (thumbnailNodes.length !== thumbnails.length) {
//         throw new Error("Thumbnail nodes and thumbnails must have the same length");
//     }

//     return (
//         <div className={classes.thumbnails} ref={ref} onWheel={handleWheel} >
//             <div className={classes.thumbnailContainer}>
//                 {thumbnails.map((t, i) => (
//                     <div key={objectKey(t)} className={clsx(classes.thumbnail, focus === t && classes.focus)} onClick={ev => handleClick(ev, i)} onPointerDown={handlePointerDown}>
//                         {thumbnailNodes[i]}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     )
// }

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
