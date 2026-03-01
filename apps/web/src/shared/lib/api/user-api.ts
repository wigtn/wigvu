import { apiClientJson } from './client';

export function getMe() {
  return apiClientJson('/api/v1/auth/me');
}

export function getProfile() {
  return apiClientJson('/api/v1/user/profile');
}

export function updateProfile(data: { displayName?: string; preferredLanguage?: string }) {
  return apiClientJson('/api/v1/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function getUsage() {
  return apiClientJson('/api/v1/user/usage');
}
