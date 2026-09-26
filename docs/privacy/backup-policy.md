# Backup Policy & Disaster Recovery Boundaries — Between Us

**Tagline**: Two People. One Private Connection.  
**System Phase**: Phase 03 — Privacy & Data Classification  
**Status**: Authoritative Privacy Specification  

---

## 1. Disaster Recovery vs. User Data Backup

Because **Between Us** maintains an explicit zero persistent database posture (`DATABASE = NONE FOR V1`), system backup policies strictly distinguish **System Infrastructure Recovery** from **User Data Archiving**:

```
+-----------------------------------------------------------------------------------+
| INFRASTRUCTURE DISASTER RECOVERY (PERMITTED)                                       |
| - Source code git repository (GitHub)                                             |
| - Infrastructure automation scripts (Ansible playbooks, Dockerfiles)               |
| - Server systemd configuration files & coturn build templates                     |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| USER DATA BACKUP & ARCHIVING (STRICTLY PROHIBITED)                                |
| - ZERO Call Recording Backups                                                     |
| - ZERO Call History or Call Log Backups                                           |
| - ZERO User Account or Relationship Backups                                       |
| - ZERO Server-Side Private Identity Key Backups                                   |
| - ZERO Ephemeral Session State Backups                                            |
+-----------------------------------------------------------------------------------+
```

---

## 2. Backup Exclusion & Prohibition Rules

1. **NO BACKUP DRIVERS ON SIGNALING VPS**: The Node.js signaling daemon must not execute backup cron jobs, database dumps, or state snapshot scripts.
2. **NO BACKUP DRIVERS ON TURN VPS**: Coturn relay servers must not maintain packet capture archives or relay session history dumps.
3. **NO CLOUD STORAGE BUCKETS**: Production deployment configurations must zero-provision AWS S3, Google Cloud Storage, Azure Blob Storage, or Vercel Blob stores.
4. **NO CLIENT CLOUD KEY ESCROW**: Private identity cryptographic keys generated in browser IndexedDB must NEVER be exported or synced to cloud backup services (e.g. iCloud Backup, Google Drive Sync) without explicit user OS-level key isolation boundary controls.
