Add-Type -AssemblyName System.Drawing

$srcPath = "D:\mnasa\teacher-avatar.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "teacher-avatar.jpg not found!"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Create-MasterIcon {
    param(
        [int]$CanvasSize = 512,
        [bool]$IsMaskable = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # 1. Background Fill: Premium Deep Navy / Indigo
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point(0, $CanvasSize)),
        [System.Drawing.Color]::FromArgb(255, 11, 15, 29),
        [System.Drawing.Color]::FromArgb(255, 23, 27, 49)
    )
    $g.FillRectangle($bgBrush, 0, 0, $CanvasSize, $CanvasSize)
    $bgBrush.Dispose()

    # 2. Subtle Radial Glow in Center
    $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowPath.AddEllipse(0, 0, $CanvasSize, $CanvasSize)
    $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
    $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(65, 79, 70, 229)
    $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 11, 15, 29))
    $g.FillEllipse($glowBrush, 0, 0, $CanvasSize, $CanvasSize)
    $glowBrush.Dispose()
    $glowPath.Dispose()

    # Scale factors: For maskable, safe zone is 66% (338px diameter). For normal, 78% (400px diameter).
    $scaleRatio = if ($IsMaskable) { 0.68 } else { 0.78 }
    $avatarDiameter = [int]($CanvasSize * $scaleRatio)
    $avatarX = [int](($CanvasSize - $avatarDiameter) / 2)
    # Position avatar slightly above center to leave room for bottom badge
    $avatarY = [int](($CanvasSize * 0.44) - ($avatarDiameter / 2))

    # 3. Outer Glowing Ring behind photo
    $ringThickness = [Math]::Max(4, [int]($CanvasSize * 0.016))
    $ringRect = New-Object System.Drawing.Rectangle(
        ($avatarX - $ringThickness),
        ($avatarY - $ringThickness),
        ($avatarDiameter + ($ringThickness * 2)),
        ($avatarDiameter + ($ringThickness * 2))
    )
    $ringBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $ringRect,
        [System.Drawing.Color]::FromArgb(255, 245, 158, 11),  # Gold
        [System.Drawing.Color]::FromArgb(255, 99, 102, 241),  # Violet
        45.0
    )
    $ringPen = New-Object System.Drawing.Pen($ringBrush, $ringThickness)
    $g.DrawEllipse($ringPen, $ringRect)
    $ringPen.Dispose()
    $ringBrush.Dispose()

    # 4. Circular Clip for the Teacher Portrait
    $circlePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $circlePath.AddEllipse($avatarX, $avatarY, $avatarDiameter, $avatarDiameter)
    $state = $g.Save()
    $g.SetClip($circlePath)

    # In 912x1153 portrait, crop square from top-center (Y=0 to Y=912) focusing on head & suit
    $srcSquareSize = [Math]::Min($srcImg.Width, $srcImg.Height)
    $cropX = [int](($srcImg.Width - $srcSquareSize) / 2)
    $cropY = [int]($srcImg.Height * 0.02) # top 2% offset to center face perfectly

    $destRect = New-Object System.Drawing.Rectangle($avatarX, $avatarY, $avatarDiameter, $avatarDiameter)
    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $srcSquareSize, $srcSquareSize)

    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Restore($state)
    $circlePath.Dispose()

    # 5. Inner subtle border around avatar
    $innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 255, 255), 2)
    $g.DrawEllipse($innerPen, $avatarX, $avatarY, $avatarDiameter, $avatarDiameter)
    $innerPen.Dispose()

    # 6. Premium Bottom Banner / Emblem ("THE MASTER")
    $badgeWidth = [int]($avatarDiameter * 0.72)
    $badgeHeight = [int]($CanvasSize * 0.088)
    $badgeX = [int](($CanvasSize - $badgeWidth) / 2)
    $badgeY = [int]($avatarY + $avatarDiameter - ($badgeHeight * 0.55))

    $badgeRect = New-Object System.Drawing.Rectangle($badgeX, $badgeY, $badgeWidth, $badgeHeight)
    $badgePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = [int]($badgeHeight / 2)
    $badgePath.AddArc($badgeX, $badgeY, $radius * 2, $radius * 2, 180, 90)
    $badgePath.AddArc($badgeX + $badgeWidth - ($radius * 2), $badgeY, $radius * 2, $radius * 2, 270, 90)
    $badgePath.AddArc($badgeX + $badgeWidth - ($radius * 2), $badgeY + $badgeHeight - ($radius * 2), $radius * 2, $radius * 2, 0, 90)
    $badgePath.AddArc($badgeX, $badgeY + $badgeHeight - ($radius * 2), $radius * 2, $radius * 2, 90, 90)
    $badgePath.CloseFigure()

    # Badge Shadow & Fill
    $badgeBgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $badgeRect,
        [System.Drawing.Color]::FromArgb(255, 30, 27, 75),
        [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
        90.0
    )
    $g.FillPath($badgeBgBrush, $badgePath)
    $badgeBgBrush.Dispose()

    # Badge Border
    $badgeBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 245, 158, 11), [Math]::Max(1, [int]($CanvasSize * 0.005)))
    $g.DrawPath($badgeBorderPen, $badgePath)
    $badgeBorderPen.Dispose()
    $badgePath.Dispose()

    # Badge Text
    $fontSize = [float]($badgeHeight * 0.44)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 254, 243, 199))
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = New-Object System.Drawing.RectangleF($badgeX, $badgeY, $badgeWidth, $badgeHeight)
    $g.DrawString("THE MASTER", $font, $textBrush, $textRect, $sf)
    $font.Dispose()
    $textBrush.Dispose()
    $sf.Dispose()

    $g.Dispose()
    return $bmp
}

$outputDir = "D:\mnasa\public\icons"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$sizes = @(48, 72, 96, 128, 144, 192, 256, 384, 512)

Write-Host "Generating Standard & Maskable PWA App Icons..." -ForegroundColor Cyan

foreach ($sz in $sizes) {
    # 1. Standard Icon
    $iconBmp = Create-MasterIcon -CanvasSize $sz -IsMaskable $false
    $outPath = Join-Path $outputDir "icon-${sz}x${sz}.png"
    $iconBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconBmp.Dispose()
    Write-Host "[OK] Created $outPath"

    # Also copy 192 and 512 directly to root and public for root URLs
    if ($sz -eq 192 -or $sz -eq 512) {
        $rootCopy = "D:\mnasa\public\icon-${sz}x${sz}.png"
        Copy-Item $outPath $rootCopy -Force
    }
}

# 2. Maskable Icons (Safe margins for Android adaptive launcher)
$maskableSizes = @(192, 512)
foreach ($sz in $maskableSizes) {
    $maskBmp = Create-MasterIcon -CanvasSize $sz -IsMaskable $true
    $outPath = Join-Path $outputDir "icon-maskable-${sz}x${sz}.png"
    $maskBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $maskBmp.Dispose()
    Write-Host "[OK] Created Maskable $outPath"

    # Copy to public root as well
    Copy-Item $outPath "D:\mnasa\public\icon-maskable-${sz}x${sz}.png" -Force
}

# 3. Apple Touch Icon (180x180)
$appleBmp = Create-MasterIcon -CanvasSize 180 -IsMaskable $false
$appleBmp.Save("D:\mnasa\public\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$appleBmp.Dispose()
Write-Host "Created Apple Touch Icon 180x180"

# 4. Favicon (48x48 and 32x32)
$favBmp = Create-MasterIcon -CanvasSize 48 -IsMaskable $false
$favBmp.Save("D:\mnasa\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Dispose()
Write-Host "[OK] Created Favicon (48x48)"

# 5. Android Native Mipmaps (Capacitor / Android Studio)
$androidResDir = "D:\mnasa\android\app\src\main\res"
if (Test-Path $androidResDir) {
    Write-Host "Updating Android Native Mipmaps..." -ForegroundColor Cyan
    $mipmaps = @(
        @{ Dir="mipmap-mdpi"; Size=48; FgSize=108 },
        @{ Dir="mipmap-hdpi"; Size=72; FgSize=162 },
        @{ Dir="mipmap-xhdpi"; Size=96; FgSize=216 },
        @{ Dir="mipmap-xxhdpi"; Size=144; FgSize=324 },
        @{ Dir="mipmap-xxxhdpi"; Size=192; FgSize=432 }
    )

    foreach ($m in $mipmaps) {
        $targetFolder = Join-Path $androidResDir $m.Dir
        if (Test-Path $targetFolder) {
            # Legacy ic_launcher.png
            $b1 = Create-MasterIcon -CanvasSize $m.Size -IsMaskable $false
            $b1.Save((Join-Path $targetFolder "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
            $b1.Save((Join-Path $targetFolder "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
            $b1.Dispose()

            # Adaptive ic_launcher_foreground.png
            $bFg = Create-MasterIcon -CanvasSize $m.FgSize -IsMaskable $true
            $bFg.Save((Join-Path $targetFolder "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
            $bFg.Dispose()

            Write-Host "[OK] Updated Android $($m.Dir)"
        }
    }
}

$srcImg.Dispose()
Write-Host "[OK] All App Icons Generated Successfully!" -ForegroundColor Green
