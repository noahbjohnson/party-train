import { ANIMATION_DURATION } from '../utils/Constants.js';

export interface AnimationOptions {
  duration?: number;
  easing?: 'ease-out' | 'ease-in' | 'ease-in-out' | 'linear';
}

export class AnimationManager {
  animatePosition(
    element: HTMLElement,
    toX: number,
    toY: number,
    options?: AnimationOptions,
  ): Promise<void> {
    const duration = options?.duration ?? ANIMATION_DURATION.tilePlay;
    const easing = options?.easing ?? 'ease-out';

    return new Promise(resolve => {
      element.style.transition = `left ${duration}ms ${easing}, top ${duration}ms ${easing}`;
      element.style.left = `${toX}px`;
      element.style.top = `${toY}px`;

      setTimeout(resolve, duration);
    });
  }

  animateScale(
    element: HTMLElement,
    scale: number,
    duration: number = 200,
  ): Promise<void> {
    return new Promise(resolve => {
      const current = element.style.transform;
      element.style.transition = `transform ${duration}ms ease-out`;
      element.style.transform = `${current} scale(${scale})`;
      setTimeout(() => {
        element.style.transform = current;
        setTimeout(resolve, duration);
      }, duration);
    });
  }

  pulse(element: HTMLElement, duration: number = 300): Promise<void> {
    return this.animateScale(element, 1.15, duration);
  }

  fadeIn(element: HTMLElement, duration: number = 200): Promise<void> {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms ease-in`;
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        setTimeout(resolve, duration);
      });
    });
  }

  fadeOut(element: HTMLElement, duration: number = 200): Promise<void> {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease-out`;
      element.style.opacity = '0';
      setTimeout(resolve, duration);
    });
  }
}
