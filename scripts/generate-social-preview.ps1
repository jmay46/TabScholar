$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot "brand\tabscholar-logo-source.png"
$outputPath = Join-Path $projectRoot "brand\tabscholar-social-preview.png"

if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
  throw "Missing source artwork: $sourcePath"
}

$canvas = New-Object System.Drawing.Bitmap 1280, 640
$canvas.SetResolution(96, 96)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$source = [System.Drawing.Image]::FromFile($sourcePath)

try {
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $backgroundBounds = New-Object System.Drawing.Rectangle 0, 0, 1280, 640
  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundBounds,
    [System.Drawing.ColorTranslator]::FromHtml("#F0EFFF"),
    [System.Drawing.ColorTranslator]::FromHtml("#E8FBF7"),
    12
  )

  try {
    $graphics.FillRectangle($background, $backgroundBounds)
  }
  finally {
    $background.Dispose()
  }

  $indigoGlow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 41, 40, 143))
  $tealGlow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 25, 203, 166))

  try {
    $graphics.FillEllipse($indigoGlow, -150, -210, 620, 620)
    $graphics.FillEllipse($tealGlow, 1010, 390, 420, 420)
  }
  finally {
    $indigoGlow.Dispose()
    $tealGlow.Dispose()
  }

  $logoWidth = 370
  $logoHeight = [Math]::Round($logoWidth * $source.Height / $source.Width)
  $logoY = [Math]::Round((640 - $logoHeight) / 2)
  $graphics.DrawImage($source, 88, $logoY, $logoWidth, $logoHeight)

  $eyebrowFont = New-Object System.Drawing.Font "Segoe UI Semibold", 18, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $titleFont = New-Object System.Drawing.Font "Segoe UI", 78, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $taglineFont = New-Object System.Drawing.Font "Segoe UI", 29, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $metaFont = New-Object System.Drawing.Font "Segoe UI Semibold", 18, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#171A52"))
  $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#48516A"))
  $teal = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#0F9F8F"))

  try {
    $graphics.DrawString("LOCAL-FIRST STUDY WORKSPACE", $eyebrowFont, $teal, 526, 151)
    $graphics.DrawString("TabScholar", $titleFont, $ink, 516, 184)

    $taglineFormat = New-Object System.Drawing.StringFormat
    try {
      $taglineFormat.Trimming = [System.Drawing.StringTrimming]::Word
      $taglineBounds = New-Object System.Drawing.RectangleF 526, 295, 650, 100
      $graphics.DrawString("Study what you choose. Control what you share.", $taglineFont, $muted, $taglineBounds, $taglineFormat)
    }
    finally {
      $taglineFormat.Dispose()
    }

    $graphics.DrawString("MANUAL INPUT   |   MINIMAL PERMISSIONS   |   SYNTHETIC LAB", $metaFont, $muted, 529, 417)
  }
  finally {
    $eyebrowFont.Dispose()
    $titleFont.Dispose()
    $taglineFont.Dispose()
    $metaFont.Dispose()
    $ink.Dispose()
    $muted.Dispose()
    $teal.Dispose()
  }

  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $source.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
}

Write-Host "Generated brand/tabscholar-social-preview.png"
