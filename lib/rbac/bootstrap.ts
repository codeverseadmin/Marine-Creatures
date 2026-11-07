import { SettingModel } from '@/models/Setting';
import { EmployeeModel } from '@/models/Employee';

export const BOOTSTRAP_SEALED_KEY = 'security.bootstrap_sealed';

/**
 * Checks whether the system is in an unsealed, fresh initial state eligible for bootstrap.
 * Deny by default: Fails closed (returns false) if database is unavailable or query fails.
 *
 * Rules:
 * 1. If security.bootstrap_sealed is true in SettingModel, bootstrap is permanently sealed (returns false).
 * 2. If ANY Owner account exists in MongoDB Atlas (active, suspended, or invited), bootstrap is sealed
 *    and the setting is automatically synchronized (returns false).
 * 3. Bootstrap is allowed ONLY when no seal exists AND zero Owner accounts exist in MongoDB Atlas.
 */
export async function isBootstrapAllowed(): Promise<boolean> {
  try {
    // 1. Check persistent seal setting in MongoDB
    const sealSetting = await SettingModel.findOne({ key: BOOTSTRAP_SEALED_KEY }).lean();
    if (
      sealSetting &&
      (sealSetting.value === true ||
        (typeof sealSetting.value === 'object' && sealSetting.value !== null && sealSetting.value.sealed === true))
    ) {
      return false; // Permanently sealed
    }

    // 2. Check if ANY Owner account exists (active, suspended, or invited)
    // Any existing Owner permanently disqualifies bootstrap
    const ownerCount = await EmployeeModel.countDocuments({ roleId: 'owner' });
    if (ownerCount > 0) {
      // Auto-seal the system to ensure SettingModel is synchronized
      await sealBootstrap('existing_owner_detected');
      return false;
    }

    // 3. Genuine empty installation: Bootstrap allowed
    return true;
  } catch (error) {
    console.error('[Bootstrap] Failed to evaluate bootstrap state, failing closed:', error);
    return false; // Strictly fail closed on database errors
  }
}

/**
 * Permanently seals bootstrap in MongoDB Atlas using an atomic upsert.
 */
export async function sealBootstrap(reason: string, actorEmail?: string): Promise<boolean> {
  try {
    await SettingModel.findOneAndUpdate(
      { key: BOOTSTRAP_SEALED_KEY },
      {
        $set: {
          value: {
            sealed: true,
            sealedAt: new Date(),
            reason,
            sealedBy: actorEmail || 'system',
          },
        },
      },
      { upsert: true, new: true }
    );
    return true;
  } catch (error) {
    console.error('[Bootstrap] Failed to seal bootstrap state:', error);
    return false;
  }
}

/**
 * Atomically claims the bootstrap lock during initial Owner creation.
 * Uses MongoDB unique index constraint on SettingModel.key to guarantee
 * that exactly ONE concurrent bootstrap initialization can establish the initial Owner.
 * Returns true if claim succeeded; false if already claimed/sealed.
 */
export async function claimBootstrapSeal(actorEmail: string): Promise<boolean> {
  try {
    // Check if already sealed first
    const allowed = await isBootstrapAllowed();
    if (!allowed) return false;

    // Attempt atomic insertion of the unique seal record
    await SettingModel.create({
      key: BOOTSTRAP_SEALED_KEY,
      value: {
        sealed: true,
        sealedAt: new Date(),
        reason: 'first_owner_created',
        sealedBy: actorEmail,
      },
    });

    return true;
  } catch (err: any) {
    // E11000 duplicate key error means another concurrent request already claimed the seal
    if (err.code === 11000) {
      console.warn('[Bootstrap] Concurrent bootstrap claim rejected via unique index constraint');
      return false;
    }
    console.error('[Bootstrap] Atomic bootstrap claim error:', err);
    return false;
  }
}

