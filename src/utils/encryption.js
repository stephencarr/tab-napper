/**
 * Encryption utilities for Tab Napper
 * Implements E2EE with AES-GCM encryption using Web Crypto API
 */

// Key management
const ENCRYPTION_KEY_STORAGE_KEY = 'triageHub_encryptionKey';

/**
 * Generate a new 256-bit AES encryption key
 */
async function generateEncryptionKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to raw bytes for storage
 */
async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported));
}

/**
 * Import raw bytes back to a CryptoKey
 */
async function importKey(keyData) {
  const keyBytes = new Uint8Array(keyData);
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create the encryption key from chrome.storage.sync
 */
async function getOrCreateEncryptionKey() {
  try {
    // Check if Chrome storage API is available
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
      throw new Error('Chrome storage API not available');
    }

    // Try to get existing key from sync storage
    const result = await chrome.storage.sync.get([ENCRYPTION_KEY_STORAGE_KEY]);

    if (result[ENCRYPTION_KEY_STORAGE_KEY]) {
      // Import existing key
      return await importKey(result[ENCRYPTION_KEY_STORAGE_KEY]);
    } else {
      // Generate new key
      console.log('[Tab Napper] Generating new encryption key...');
      const newKey = await generateEncryptionKey();

      // Export and store in sync storage
      const exportedKey = await exportKey(newKey);
      await chrome.storage.sync.set({
        [ENCRYPTION_KEY_STORAGE_KEY]: exportedKey
      });

      console.log('[Tab Napper] Encryption key stored in sync storage');
      return newKey;
    }
  } catch (error) {
    console.error('[Tab Napper] Error managing encryption key:', error);
    throw error;
  }
}

/**
 * Encrypt a string using AES-GCM
 */
async function encryptString(plaintext) {
  try {
    const key = await getOrCreateEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('[Tab Napper] Encryption error:', error);
    throw error;
  }
}

/**
 * Decrypt a string using AES-GCM
 */
async function decryptString(ciphertext) {
  try {
    const key = await getOrCreateEncryptionKey();
    
    // Convert from base64
    const data = new Uint8Array(
      atob(ciphertext)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[Tab Napper] Decryption error:', error);
    throw error;
  }
}

export {
  getOrCreateEncryptionKey,
  encryptString,
  decryptString
};