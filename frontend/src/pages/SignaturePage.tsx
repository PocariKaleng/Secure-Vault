import { useState } from "react";
import { BadgeCheck, Fingerprint, KeyRound, Signature } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import {
    createSigningKeyPair,
    exportPublicKey,
    signMessage,
    verifyMessage,
} from "../crypto/signatures/ecdsa";

const DEFAULT_MESSAGE = "SecureVault portfolio release manifest v1";

function bytesToBase64Url(bytes: Uint8Array): string {
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join("");
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
async function publicKeyFingerprint(key: CryptoKey): Promise<string> {
    const spki = await crypto.subtle.exportKey("spki", key);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", spki));
    return Array.from(digest.subarray(0, 12), byte => byte.toString(16).padStart(2, "0")).join(":");
}

export default function SignaturePage() {
    const [message, setMessage] = useState(DEFAULT_MESSAGE);
    const [keys, setKeys] = useState<CryptoKeyPair | null>(null);
    const [publicKey, setPublicKey] = useState("");
    const [fingerprint, setFingerprint] = useState("");
    const [signature, setSignature] = useState<Uint8Array<ArrayBuffer> | null>(null);
    const [notice, setNotice] = useState("");
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function handleCreateKeys() {
        setBusy(true);
        setError("");
        try {
            const nextKeys = await createSigningKeyPair();
            const jwk = await exportPublicKey(nextKeys.publicKey);
            setKeys(nextKeys);
            setPublicKey(JSON.stringify(jwk, null, 2));
            setFingerprint(await publicKeyFingerprint(nextKeys.publicKey));
            setSignature(null);
            setIsValid(null);
            setNotice("Key pair ready. The private key exists only in this tab's memory.");
        } catch {
            setError("The browser could not create an ECDSA P-256 key pair.");
        } finally {
            setBusy(false);
        }
    }

    async function handleSign() {
        if (!keys) return;
        setBusy(true);
        setError("");
        try {
            setSignature(await signMessage(message, keys.privateKey));
            setIsValid(null);
            setNotice("Message signed successfully. Change it to demonstrate tamper detection.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to sign the message.");
        } finally {
            setBusy(false);
        }
    }

    async function handleVerify() {
        if (!keys || !signature) return;
        setBusy(true);
        setError("");
        try {
            const valid = await verifyMessage(message, signature, keys.publicKey);
            setIsValid(valid);
            setNotice(valid ? "Signature is valid. The message matches the signature and public key." : "");
        } catch {
            setIsValid(false);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="page">
            <div className="page-title">
                <p className="eyebrow">05 / AUTHENTICITY LAB</p>
                <h2>Digital Signature</h2>
                <p>Sign a message with ECDSA P-256 and see how any change causes verification to fail.</p>
            </div>

            <div className="signature-layout">
                <Card title="ECDSA Workbench" description="P-256 for the key pair, SHA-256 for message hashing, and Web Crypto for every operation.">
                    <div className="signature-form">
                        <label className="form-group">
                            <span>Message to sign</span>
                            <textarea value={message} maxLength={65_536} disabled={busy}
                                onChange={event => { setMessage(event.target.value); setIsValid(null); setNotice(""); }} />
                        </label>

                        <div className="signature-actions">
                            <Button type="button" variant="secondary" disabled={busy} onClick={handleCreateKeys}>
                                <KeyRound size={16} />Generate key pair
                            </Button>
                            <Button type="button" disabled={busy || !keys || !message} onClick={handleSign}>
                                <Signature size={16} />Sign message
                            </Button>
                            <Button type="button" variant="secondary" disabled={busy || !signature} onClick={handleVerify}>
                                <BadgeCheck size={16} />Verify signature
                            </Button>
                        </div>

                        {notice && <div role="status" className="alert alert-success">{notice}</div>}
                        {isValid === false && <div role="alert" className="alert alert-error">Signature is invalid. The message or signature has changed.</div>}
                        {error && <div role="alert" className="alert alert-error">{error}</div>}

                        {signature && <div className="signature-output"><span>Signature / raw r || s / Base64URL</span><code>{bytesToBase64Url(signature)}</code></div>}
                    </div>
                </Card>

                <aside className="signature-key-panel" aria-label="Public key summary">
                    <Fingerprint size={26} />
                    <p className="eyebrow">PUBLIC IDENTITY</p>
                    <h3>{fingerprint || "No key pair yet"}</h3>
                    <p>The public key can be shared for verification. The private key is non-extractable and is never stored in IndexedDB.</p>
                    {publicKey && <details><summary>View public key JWK</summary><pre className="code-block">{publicKey}</pre></details>}
                </aside>
            </div>

            <p className="form-hint">ECDSA proves message authenticity and integrity; it does not encrypt content. Reload the page to discard the demo key pair.</p>
        </div>
    );
}
