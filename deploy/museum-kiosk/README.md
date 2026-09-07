# Museum kiosk setup

Everything needed to run the 1931 map exhibit on a screen in a museum,
unattended, around the clock.

The exhibit is one self-contained HTML file. It needs no internet. This was
tested by rendering it with all name resolution blackholed, and the result was
pixel for pixel the same as the online render.

---

## Pick the machine first

**Use a Windows 11 PC if the display is a touchscreen.** macOS has no built-in
support for touchscreen monitors. A touch panel plugged into a Mac may do
nothing at all, or may act like a mouse with no multi-touch, depending on
whether the panel's maker ships a Mac driver. Windows treats touch as a first
class input and needs no driver.

Use a Mac only if the display is an ordinary non-touch monitor, or if the Mac
is what you already have and visitors will not be touching the screen.

Whatever you pick, borrow the actual panel and test it with the actual exhibit
before you buy anything. That single test decides the operating system, so do
it before any of the setup below.

Windows 11 Home is fine. You do not need Pro. The setup here does its own
watchdog rather than relying on Windows Assigned Access, because Assigned
Access does not reliably relaunch a third-party browser like Chrome.

---

## Windows setup

Copy this whole folder and the exhibit HTML onto the museum PC first.

1. Install Google Chrome from google.com/chrome.

2. Give the display account a password. Windows cannot sign in automatically
   to an account with a blank password, so a blank one breaks the whole
   recovery plan.

3. Right-click **Windows PowerShell** and choose **Run as administrator**.

4. Check the scripts parse before you run them. This catches a typo in
   seconds instead of leaving a black screen on a wall.

   ```powershell
   Get-ChildItem *.ps1 | ForEach-Object { $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $_ -Raw), [ref]$null); "$($_.Name) parsed OK" }
   ```

5. Run the installer.

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1
   ```

   It asks you to type MUSEUM before it changes anything.

6. Do the three manual steps it prints at the end. They are automatic logon,
   the BIOS power-on setting, and hiding the taskbar. **The BIOS one matters
   most.** It is the only real answer to "if it turns off, turn it back on",
   and no script can set it.

To remove everything, run `Uninstall-Kiosk.ps1` the same way.

---

## Mac setup

Copy this whole folder and the exhibit HTML onto the museum Mac first.

1. Install Google Chrome from google.com/chrome.

2. Open Terminal and run:

   ```bash
   cd ~/Desktop/museum-kiosk/macos && bash install-kiosk.sh
   ```

   Adjust the path to wherever you put the folder. It asks you to type MUSEUM
   before it changes anything, and asks for your Mac password once to set the
   power options.

3. Do the three manual steps it prints at the end. Turning FileVault off comes
   before turning automatic login on, because automatic login is impossible
   while FileVault is running. Decryption can take anywhere from twenty
   minutes to several hours, so start it early.

To remove everything, run `bash uninstall-kiosk.sh`.

---

## Test it before it leaves your house

Do not deliver an untested machine. Work through all six. Anything that fails
here fails worse in a gallery.

| # | Test | What should happen |
|---|---|---|
| 1 | Restart the machine | The exhibit is back on screen by itself, with no login screen and no desktop visible |
| 2 | Pull the power cord, plug it back in, press power | Same as above, and no "Chrome didn't shut down correctly" message |
| 3 | Close the browser (Alt+F4 on Windows, Cmd+Q on Mac) | It reappears within about ten seconds |
| 4 | Unplug the network cable or turn off wifi, then reload | The map, fonts and images all still appear |
| 5 | Leave it untouched for a minute | It returns to the "Touch anywhere to begin" screen on its own |
| 6 | Touch every part of the exhibit for five minutes | No address bar, no menus, no way out, nothing else opens |

If test 4 fails, the wrong file got copied. The real one is about 7 MB.

---

## Updating the exhibit later

The machine is locked down, so the easy route is a USB stick.

1. Rebuild the file with `node scripts/build-kiosk.mjs` in the site repo.
2. Copy it to a USB stick.
3. On the kiosk, replace the file at
   `C:\RootedForwardKiosk\exhibit.html` or
   `/Users/Shared/RootedForwardKiosk/exhibit.html`.
4. Close the browser. The watchdog reopens it with the new file within ten
   seconds.

On Windows you will need the Task Manager and Windows key back to do this
comfortably. Run `Uninstall-Kiosk.ps1`, make the change, then run
`Install-Kiosk.ps1` again.

---

## Worth deciding before install day

- **Ask the museum whether the machine may stay powered overnight.** If the
  building cuts power to the gallery at closing, the BIOS power-on setting is
  what brings it back, and the daily scheduled power-on is what covers the
  rest.
- **Ask whether there is usable network in the gallery.** Guest wifi behind a
  sign-in page is common in public buildings and means no remote access at
  all. In that case the recovery plan is a printed page taped inside the
  cabinet telling a staff member how to power cycle it.
- **The exhibit resets after twenty seconds of no touching.** That is short
  for a wall panel with this much reading on it, and a visitor part way
  through a paragraph will get sent back to the start. Consider raising it to
  sixty or ninety seconds in `scripts/build-kiosk.mjs` before you build the
  final file.
- **Take a disk image once it works.** Recovering a dead machine should be a
  restore, not a rebuild from this README.

---

## If it goes wrong

Read the log first. It records every start, every restart, and every reason
it gave up.

```
C:\RootedForwardKiosk\kiosk.log
/Users/Shared/RootedForwardKiosk/kiosk.log
```

| Symptom | Usual cause |
|---|---|
| Black screen after a power cut | Automatic logon is not on, or FileVault is still enabled on the Mac |
| Browser opens then closes over and over | The exhibit file is missing or was replaced with the wrong one. The log says which |
| Blank white page | The wrong HTML file was copied. Check it is about 7 MB |
| A restore-tabs bar across the top | The watchdog script did not get installed, only the browser did |
| Screen goes dark after a while | Sleep settings did not apply. Rerun the installer as administrator |

---

## What these scripts change

Both installers save what they found before changing it, and both
uninstallers put it back. Neither touches your files, your accounts, or
anything outside the settings listed here.

**Windows.** A scheduled task at logon. Chrome enterprise policies that lock
the browser to the exhibit file. Task Manager, the Windows key and Control
Panel disabled for the display account. Sleep and screen blanking turned off.
Windows Update told not to reboot between 7am and 10pm.

**Mac.** Two launch agents in your own account. Screen saver off, Dock hidden,
hot corners disabled. Sleep held off while the exhibit is running. Automatic
restart after a power cut, and a daily power-on at 7am.

Neither installer will run without you typing MUSEUM first, so neither can be
triggered by accident on a machine you actually use.
