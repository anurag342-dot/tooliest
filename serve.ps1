$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Start()
Write-Host 'Server running at http://localhost:8080/'

$root = 'C:\Users\Msi\.gemini\antigravity\scratch'

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $filePath = $request.Url.LocalPath
    if ($filePath -eq '/') { $filePath = '/index.html' }

    $fullPath = Join-Path $root ($filePath.TrimStart('/'))

    if (Test-Path $fullPath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($fullPath)
        $ext = [System.IO.Path]::GetExtension($fullPath)
        switch ($ext) {
            '.html' { $response.ContentType = 'text/html; charset=utf-8' }
            '.css'  { $response.ContentType = 'text/css; charset=utf-8' }
            '.js'   { $response.ContentType = 'application/javascript; charset=utf-8' }
            '.json' { $response.ContentType = 'application/json' }
            '.xml'  { $response.ContentType = 'application/xml' }
            '.txt'  { $response.ContentType = 'text/plain' }
            default { $response.ContentType = 'application/octet-stream' }
        }
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $content = [System.IO.File]::ReadAllBytes((Join-Path $root 'index.html'))
        $response.ContentType = 'text/html; charset=utf-8'
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    }
    $response.Close()
}
