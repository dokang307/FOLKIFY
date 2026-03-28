# Making Scripts Executable on Windows

## Task 6.3: Make Scripts Executable

This task requires making the following scripts executable:

- `folkify_BE/scripts/migrate.sh`
- `folkify_BE/scripts/seed-supabase.sh`
- `folkify_BE/scripts/verify-migration.sh`

## Why This Is Needed

On Unix/Linux systems, shell scripts need the executable permission bit set to be run directly (e.g., `./migrate.sh`). Without this permission, you would need to explicitly call the shell (e.g., `bash migrate.sh`).

## Windows-Specific Considerations

On Windows, the concept of executable permissions works differently. However, if you're using Git for version control, Git can track the executable bit and preserve it when the repository is cloned on Unix/Linux systems.

## Solutions

### Option 1: Using WSL (Windows Subsystem for Linux) - RECOMMENDED

If you have WSL installed, open a WSL terminal and run:

```bash
cd /mnt/d/Khang/FPT\ semester/semester_7/EXE101/FOLKIFY_final
chmod +x folkify_BE/scripts/migrate.sh
chmod +x folkify_BE/scripts/seed-supabase.sh
chmod +x folkify_BE/scripts/verify-migration.sh
```

Or navigate to the project directory in WSL and run:

```bash
chmod +x folkify_BE/scripts/migrate.sh
chmod +x folkify_BE/scripts/seed-supabase.sh
chmod +x folkify_BE/scripts/verify-migration.sh
```

### Option 2: Using Git Bash

If you have Git for Windows installed, open Git Bash and run:

```bash
cd /d/Khang/FPT\ semester/semester_7/EXE101/FOLKIFY_final
chmod +x folkify_BE/scripts/migrate.sh
chmod +x folkify_BE/scripts/seed-supabase.sh
chmod +x folkify_BE/scripts/verify-migration.sh
```

### Option 3: Using Git to Set Executable Bit

If this is a Git repository, you can use Git to set the executable bit:

```bash
git update-index --chmod=+x folkify_BE/scripts/migrate.sh
git update-index --chmod=+x folkify_BE/scripts/seed-supabase.sh
git update-index --chmod=+x folkify_BE/scripts/verify-migration.sh
git commit -m "Make migration and seed scripts executable"
```

This ensures the executable bit is tracked in Git and will be preserved when the repository is cloned.

### Option 4: Using PowerShell Script

We've created a PowerShell script that can do this for you. Run:

```powershell
powershell -ExecutionPolicy Bypass -File folkify_BE/scripts/make-executable.ps1
```

### Option 5: Run Scripts Without Executable Permission

On Windows, you can always run the scripts by explicitly calling bash:

```bash
bash folkify_BE/scripts/migrate.sh
bash folkify_BE/scripts/seed-supabase.sh
bash folkify_BE/scripts/verify-migration.sh
```

This works without setting the executable bit.

## Verification

To verify the scripts are executable (in WSL or Git Bash):

```bash
ls -la folkify_BE/scripts/*.sh
```

You should see `-rwxr-xr-x` permissions (note the `x` for executable) instead of `-rw-r--r--`.

## For Deployment

When deploying to a Unix/Linux server (like when using Supabase or other cloud platforms), ensure the executable bit is set. The easiest way is to use Option 3 (Git) so the permission is tracked in version control.
