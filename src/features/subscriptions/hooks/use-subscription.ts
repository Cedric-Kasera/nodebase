// Stubbed subscription hook — returns no active subscription
// TODO: Replace with real call to custom backend billing API
export const useSubscription = () => ({
  data: null,
  isLoading: false,
  error: null,
});

export const useHasActiveSubscription = () => ({
  hasActiveSubscription: false,
  subscription: undefined,
  isLoading: false,
});
