/**
 * Cloudflare Access JWT verification.
 *
 * Access enforces auth at the edge, but the dashboard verifies its signed JWT
 * here too, so a misconfigured route can't leak the data.
 */

/**
 * Verify the `Cf-Access-Jwt-Assertion` header against the team's Access certs.
 * Configured via the ACCESS_TEAM_DOMAIN + ACCESS_AUD vars; if either is unset
 * we skip verification (local `wrangler dev`) but refuse in production so the
 * dashboard is never accidentally public.
 */
export async function verifyAccessJwt(request, env, url) {
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  // Checked before the configured/unconfigured branches below, not just
  // inside the "unconfigured" one — otherwise, once Access is actually
  // configured (both vars set), `wrangler dev` starts requiring a real
  // Cf-Access-Jwt-Assertion too, since wrangler.toml has no per-environment
  // split between local and deployed vars.
  if (isLocal) return { ok: true, email: 'local-dev', skipped: true };

  if (!teamDomain || !aud) {
    return { ok: false, reason: 'access not configured' };
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { ok: false, reason: 'missing Access token' };

  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    const header = decodeSegment(headerB64);
    const payload = decodeSegment(payloadB64);

    const certs = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`).then(r =>
      r.json()
    );
    const jwk = certs.keys?.find(k => k.kid === header.kid);
    if (!jwk) return { ok: false, reason: 'unknown signing key' };

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(sigB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    if (!valid) return { ok: false, reason: 'bad signature' };

    const audOk = Array.isArray(payload.aud)
      ? payload.aud.includes(aud)
      : payload.aud === aud;
    if (!audOk) return { ok: false, reason: 'audience mismatch' };
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return { ok: false, reason: 'token expired' };
    }

    return { ok: true, email: payload.email || 'unknown' };
  } catch {
    return { ok: false, reason: 'verification error' };
  }
}

function base64UrlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function decodeSegment(b64url) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(b64url)));
}
