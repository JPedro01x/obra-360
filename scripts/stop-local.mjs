import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'win32') {
  console.error('Encerre com Ctrl+C no terminal que iniciou npm run dev.'); process.exitCode = 2;
} else if (process.argv.slice(2).some(arg => arg !== '--confirmar')) {
  console.error('Use sem argumentos para identificar a instalação ou --confirmar para encerrá-la.'); process.exitCode = 2;
} else {
  // The JVM must belong to this workspace before its launcher can be stopped.
  // Workspace text is passed as environment data, never interpolated into shell code.
  const command = String.raw`
$ErrorActionPreference='Stop'
$workspaceRoot=$env:OBRA360_STOP_ROOT.TrimEnd('\').Replace('/','\')
$connections=@(Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue)
if($connections.Count -eq 0){Write-Output '{"executando":false}';exit 0}
$localProcessId=$connections[0].OwningProcess
$app=Get-CimInstance Win32_Process -Filter "ProcessId=$localProcessId"
$appCommand=([string]$app.CommandLine).Replace('/','\')
if(-not $appCommand.ToLowerInvariant().Contains($workspaceRoot.ToLowerInvariant()) -or $appCommand -notmatch 'br\.com\.obra360\.Obra360Application'){
 throw 'A porta 8080 pertence a um processo que não foi identificado como este projeto. Nenhum processo foi encerrado.'
}
$launcher=$null
for($level=0;$level -lt 10 -and $app;$level++){
 if($app.Name -eq 'node.exe' -and $app.CommandLine -match 'scripts[\\/]dev[.]mjs'){$launcher=$app;break}
 $ancestorId=$app.ParentProcessId
 $app=Get-CimInstance Win32_Process -Filter "ProcessId=$ancestorId"
}
if(-not $launcher){throw 'Inicializador local não identificado. Nenhum processo foi encerrado.'}
if($env:OBRA360_STOP_CONFIRM -eq '1'){
 & taskkill /PID $launcher.ProcessId /T /F | Out-Null
 if($LASTEXITCODE -ne 0){throw 'Não foi possível encerrar o inicializador.'}
 @{encerrado=$true;inicializador=$launcher.ProcessId}|ConvertTo-Json -Compress
}else{
 @{executando=$true;inicializador=$launcher.ProcessId;instrucao='Finalize as operações abertas e execute com --confirmar para encerrar esta instalação.'}|ConvertTo-Json -Compress
}
`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    encoding: 'utf8', windowsHide: true, timeout: 15000,
    env: { ...process.env, OBRA360_STOP_ROOT: fileURLToPath(new URL('../', import.meta.url)),
      OBRA360_STOP_CONFIRM: process.argv.includes('--confirmar') ? '1' : '0' },
  });
  if (result.stdout) console.log(result.stdout.trim());
  if (result.status !== 0) console.error('Falha ao identificar ou encerrar a instalação. Consulte o terminal que a iniciou; nenhum serviço desconhecido deve ser encerrado.');
  process.exitCode = result.status === 0 ? 0 : 1;
}
