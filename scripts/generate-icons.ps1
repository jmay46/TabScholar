$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot "brand\tabscholar-logo-source.png"
$outputDirectory = Join-Path $projectRoot "extension\assets"

if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
  throw "Missing source artwork: $sourcePath"
}

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$source = [System.Drawing.Image]::FromFile($sourcePath)

try {
  $canvasSize = [Math]::Max($source.Width, $source.Height)
  $square = New-Object System.Drawing.Bitmap $canvasSize, $canvasSize
  $square.SetResolution(96, 96)

  try {
    $graphics = [System.Drawing.Graphics]::FromImage($square)

    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

      $x = [Math]::Floor(($canvasSize - $source.Width) / 2)
      $y = [Math]::Floor(($canvasSize - $source.Height) / 2)
      $graphics.DrawImage($source, $x, $y, $source.Width, $source.Height)
    }
    finally {
      $graphics.Dispose()
    }

    foreach ($size in 16, 32, 48, 128) {
      $icon = New-Object System.Drawing.Bitmap $size, $size
      $icon.SetResolution(96, 96)

      try {
        $iconGraphics = [System.Drawing.Graphics]::FromImage($icon)

        try {
          $iconGraphics.Clear([System.Drawing.Color]::Transparent)
          $iconGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
          $iconGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
          $iconGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $iconGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
          $iconGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
          $iconGraphics.DrawImage($square, 0, 0, $size, $size)
        }
        finally {
          $iconGraphics.Dispose()
        }

        $outputPath = Join-Path $outputDirectory "icon$size.png"
        $icon.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
      }
      finally {
        $icon.Dispose()
      }
    }
  }
  finally {
    $square.Dispose()
  }
}
finally {
  $source.Dispose()
}

Write-Host "Generated extension icons from brand/tabscholar-logo-source.png"
