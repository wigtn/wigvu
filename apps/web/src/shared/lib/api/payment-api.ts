import { apiClientJson } from './client';

export function createCheckoutSession() {
  return apiClientJson<{ url: string }>('/api/v1/payment/create-checkout', {
    method: 'POST',
  });
}

export function createPortalSession() {
  return apiClientJson<{ url: string }>('/api/v1/payment/create-portal', {
    method: 'POST',
  });
}

export function getSubscription() {
  return apiClientJson('/api/v1/payment/subscription');
}
