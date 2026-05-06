import api from './client';

export const bnplApi = {
  // Tabby
  async getTabbyConfig(): Promise<{ publicKey: string | null; isEnabled: boolean }> {
    const { data } = await api.get('/tabby/config');
    return data;
  },

  async createTabbySession(orderId: string): Promise<{ sessionId: string; paymentUrl: string }> {
    const { data } = await api.post('/tabby/create-session', { orderId });
    return data;
  },

  async verifyTabbyPayment(orderId: string): Promise<{ status: string; message: string }> {
    const { data } = await api.post(`/tabby/verify/${orderId}`);
    return data;
  },

  // Tamara
  async getTamaraConfig(): Promise<{ isEnabled: boolean }> {
    const { data } = await api.get('/tamara/config');
    return data;
  },

  async createTamaraSession(orderId: string): Promise<{ sessionId: string; paymentUrl: string }> {
    const { data } = await api.post('/tamara/create-session', { orderId });
    return data;
  },

  async verifyTamaraPayment(orderId: string): Promise<{ status: string; message: string }> {
    const { data } = await api.post(`/tamara/verify/${orderId}`);
    return data;
  },
};
