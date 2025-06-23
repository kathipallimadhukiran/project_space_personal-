import forge from 'node-forge';
import { Booking, BookingStatus } from '../types';

export const BASE_URL = 'http://192.168.125.111:5000';

export async function signup(name: string, email: string, password: string) {
  // Fetch public key
  let publicKey: string;
  try {
    const res = await fetch(`${BASE_URL}/public-key`);
    publicKey = await res.text();
    console.log('Fetched public key:', publicKey);
  } catch (err) {
    throw new Error('Failed to fetch public key');
  }
  // Encrypt email and password using node-forge (RSA-OAEP)
  try {
    const pubKey = forge.pki.publicKeyFromPem(publicKey);
    const rawEncEmail = pubKey.encrypt(email, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    });
    console.log('Raw encrypted email buffer length:', rawEncEmail.length);
    const encEmail = forge.util.encode64(rawEncEmail);
    const rawEncPassword = pubKey.encrypt(password, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    });
    console.log('Raw encrypted password buffer length:', rawEncPassword.length);
    const encPassword = forge.util.encode64(rawEncPassword);
    const res = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: 'enc:' + encEmail,
        password: 'enc:' + encPassword,
      }),
    });
    return res.json();
  } catch (err) {
    throw new Error('Encryption failed');
  }
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function sendOtp(email: string) {
  const res = await fetch(`${BASE_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyOtp(email: string, otp: string) {
  const res = await fetch(`${BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return res.json();
}

// Profile
export async function getProfile(email: string) {
  const res = await fetch(`${BASE_URL}/profile?email=${encodeURIComponent(email)}`);
  return res.json();
}

export async function updateProfile(email: string, name: string, phone: string, bio: string) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, phone, bio }),
  });
  return res.json();
}

// Services
export async function getServices(email: string) {
  const res = await fetch(`${BASE_URL}/services?email=${encodeURIComponent(email)}`);
  return res.json();
}

export async function addService(service: any) {
  const res = await fetch(`${BASE_URL}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  return res.json();
}

export async function updateService(service: any) {
  const res = await fetch(`${BASE_URL}/services/${service._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  return res.json();
}

export async function deleteService(id: string) {
  const res = await fetch(`${BASE_URL}/services/${id}`, {
    method: 'DELETE' });
  return res.json();
}

export interface Service {
  _id: string; // MongoDB returns _id
  userEmail: string;
  title: string;
  description?: string;
  price?: number;
  // ...other fields
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  // Fetch public key
  let publicKey: string;
  try {
    const res = await fetch(`${BASE_URL}/public-key`);
    publicKey = await res.text();
  } catch (err) {
    throw new Error('Failed to fetch public key');
  }
  // Encrypt new password
  try {
    const pubKey = forge.pki.publicKeyFromPem(publicKey);
    const rawEncPassword = pubKey.encrypt(newPassword, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    });
    const encPassword = forge.util.encode64(rawEncPassword);
    const res = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp,
        newPassword: 'enc:' + encPassword,
      }),
    });
    return res.json();
  } catch (err) {
    throw new Error('Encryption failed');
  }
}

// Bookings
export async function getBookings(workerEmail: string): Promise<Booking[]> {
  const res = await fetch(`${BASE_URL}/api/bookings?workerEmail=${encodeURIComponent(workerEmail)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch bookings');
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch bookings');
  }
  return data.bookings.map((booking: any) => ({
    ...booking,
    date: new Date(booking.date)
  }));
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  
  const data = await res.json();
  
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update booking status');
  }
  
  return {
    ...data.booking,
    date: new Date(data.booking.date)
  };
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  // Fetch public key
  let publicKey: string;
  try {
    const res = await fetch(`${BASE_URL}/public-key`);
    publicKey = await res.text();
  } catch (err) {
    throw new Error('Failed to fetch public key');
  }
  // Encrypt passwords
  try {
    const pubKey = forge.pki.publicKeyFromPem(publicKey);
    const rawEncCurrent = pubKey.encrypt(currentPassword, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    });
    const encCurrent = forge.util.encode64(rawEncCurrent);
    const rawEncNew = pubKey.encrypt(newPassword, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    });
    const encNew = forge.util.encode64(rawEncNew);
    const res = await fetch(`${BASE_URL}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        currentPassword: 'enc:' + encCurrent,
        newPassword: 'enc:' + encNew,
      }),
    });
    return res.json();
  } catch (err) {
    throw new Error('Encryption failed');
  }
}

export const fetchReviews = async (workerEmail: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/reviews/worker/${workerEmail}`);
    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const respondToReview = async (reviewId: string, responseText: string, responderId: string, responderName: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/reviews/${reviewId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: responseText,
        responderId,
        responderName,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to respond to review');
    }
    return await response.json();
  } catch (error) {
    console.error('Error responding to review:', error);
    throw error;
  }
};