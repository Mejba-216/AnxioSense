import numpy as np
import json

print("="*60)
print("DIAGNOSING PERSONALIZATION DATA")
print("="*60)

with open('models/personalization_config.json') as f:
    config = json.load(f)
print("\n[CONFIG]")
print(config)

profile_mean = np.load('models/profile_mean.npy')
profile_std = np.load('models/profile_std.npy')
print(f"\n[PROFILE_MEAN] shape={profile_mean.shape}")
print(profile_mean)
print(f"\n[PROFILE_STD] shape={profile_std.shape}")
print(profile_std)

with open('models/patient_profiles.json') as f:
    profiles = json.load(f)
print(f"\n[PATIENT_PROFILES] count: {len(profiles)}")
first_pid = list(profiles.keys())[0]
print(f"First patient ({first_pid}): {profiles[first_pid]}")

core_features = config.get('core_features', [])
print(f"\n[MANUAL DISTANCE TEST]")
print(f"core_features count: {len(core_features)}")
print(f"profile_mean count: {len(profile_mean)}")
print(f"profile_std count: {len(profile_std)}")

if len(core_features) != len(profile_mean):
    print(f"\n!!! MISMATCH: core_features has {len(core_features)} items but profile_mean has {len(profile_mean)} items !!!")

profile_vectors = []
for pid, p in list(profiles.items())[:5]:
    try:
        vec = np.array([p[f] for f in core_features], dtype=float)
        profile_vectors.append((pid, vec))
        print(f"  Patient {pid}: {vec}")
    except KeyError as e:
        print(f"  Patient {pid}: MISSING FEATURE {e}")

if len(profile_vectors) >= 2:
    print("\nDistances after normalization:")
    for i in range(min(3, len(profile_vectors))):
        pid_i, vec_i = profile_vectors[i]
        for j in range(i+1, min(4, len(profile_vectors))):
            pid_j, vec_j = profile_vectors[j]
            
            norm_i = (vec_i - profile_mean) / profile_std
            norm_j = (vec_j - profile_mean) / profile_std
            
            dist_sq = np.sum((norm_i - norm_j) ** 2)
            
            for test_sigma in [1.0, 3.0, 5.0, 10.0, 20.0]:
                sim = np.exp(-dist_sq / (2 * test_sigma ** 2))
                print(f"  {pid_i} <-> {pid_j}: dist²={dist_sq:.3f}, sigma={test_sigma}: sim={sim:.6f}")
            print()