import {
  animate,
  style,
  transition,
  trigger,
  query,
  stagger,
} from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('400ms ease-out', style({ opacity: 1 })),
  ]),
]);

export const slideInUp = trigger('slideInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

export const staggerList = trigger('staggerList', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(12px)' }),
      stagger('60ms', [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

export const staggerNav = trigger('staggerNav', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(-12px)' }),
      stagger('50ms', [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
      }),
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(16px) scale(0.98)' })
    ], { optional: true }),
    query(':leave', [
      animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ opacity: 0, transform: 'translateY(-12px) scale(0.98)' })
      )
    ], { optional: true }),
    query(':enter', [
      animate('350ms 50ms cubic-bezier(0.16, 1, 0.3, 1)', 
        style({ opacity: 1, transform: 'translateY(0) scale(1)' })
      )
    ], { optional: true }),
  ]),
]);

export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '*', opacity: 1 }))
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: 0, opacity: 0 }))
  ])
]);

export const staggerRows = trigger('staggerRows', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(-8px)' }),
      stagger('50ms', [
        animate('280ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

export const slideInRight = trigger('slideInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(24px)' }),
    animate('350ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

export const slideAlert = trigger('slideAlert', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('250ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' })),
  ]),
]);

export const scaleInModal = trigger('scaleInModal', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.92) translateY(12px)' }),
    animate('280ms cubic-bezier(0.16, 1, 0.3, 1)',
      style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
  ]),
  transition(':leave', [
    animate('200ms ease-in',
      style({ opacity: 0, transform: 'scale(0.96) translateY(8px)' })),
  ]),
]);

export const tabTransition = trigger('tabTransition', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' })),
  ]),
]);

export const counterAnimate = trigger('counterAnimate', [
  transition('* => *', [
    style({ opacity: 0, transform: 'scale(0.6)' }),
    animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      style({ opacity: 1, transform: 'scale(1)' })),
  ]),
]);
