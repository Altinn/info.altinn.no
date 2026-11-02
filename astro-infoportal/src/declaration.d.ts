declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.module.scss' {
    const classes: { [key: string]: string };
    export = classes;
}

declare module 'virtual:icon-sprite' {
    export const spriteUrl: string;
    export const fullSpriteUrl: string;
    export const akselIconNames: string[];
}
