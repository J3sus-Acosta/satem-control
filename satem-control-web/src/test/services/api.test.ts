import { describe, it, expect, beforeEach } from 'vitest';
import { api, setAccessToken, getAccessToken } from '../../services/api.js';

describe('Frontend API Client (Axios & Interceptors)', () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it('debe gestionar el estado del token en memoria con setAccessToken y getAccessToken', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('token-jwt-prueba-123');
    expect(getAccessToken()).toBe('token-jwt-prueba-123');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('debe inyectar la cabecera Authorization: Bearer cuando existe un accessToken', async () => {
    setAccessToken('token-valido-abc');

    // Usar la función interna del interceptor de request de axios
    const requestInterceptor = (api.interceptors.request as any).handlers[0].fulfilled;

    const mockConfig: any = {
      headers: {},
      url: '/customers',
    };

    const transformedConfig = await requestInterceptor(mockConfig);
    expect(transformedConfig.headers.Authorization).toBe('Bearer token-valido-abc');
  });

  it('no debe inyectar la cabecera Authorization si accessToken es null', async () => {
    setAccessToken(null);

    const requestInterceptor = (api.interceptors.request as any).handlers[0].fulfilled;

    const mockConfig: any = {
      headers: {},
      url: '/customers',
    };

    const transformedConfig = await requestInterceptor(mockConfig);
    expect(transformedConfig.headers.Authorization).toBeUndefined();
  });

  it('debe tener baseURL configurado apuntando a /api/v1 y withCredentials en true', () => {
    expect(api.defaults.baseURL).toContain('/api/v1');
    expect(api.defaults.withCredentials).toBe(true);
  });
});
