const dummyValue = (val) => ({ value: val });

module.exports = {
  makeMutable: dummyValue,
  withRepeat: (anim) => anim,
  withSequence: (...anims) => anims[0],
  withTiming: (toValue) => toValue,
  withSpring: (toValue) => toValue,
  withDelay: (_, anim) => anim,
  useSharedValue: dummyValue,
  useAnimatedStyle: () => ({}),
  useDerivedValue: (fn) => ({ value: fn ? fn() : undefined }),
  useAnimatedReaction: () => {},
  useAnimatedScrollHandler: () => () => {},
  createAnimatedComponent: (Component) => Component,
  Easing: {
    linear: () => {},
    ease: () => {},
    quad: () => {},
    cubic: () => {},
    in: () => {},
    out: () => {},
    inOut: () => {},
  },
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  default: {},
};
