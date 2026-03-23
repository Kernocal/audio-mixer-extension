import type { Browser } from '#imports'
import type { Buffer } from 'node:buffer'
import type { ImageAsset } from './types'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { details } from './details'

const pattern = /\s+/

// holy ai
function getPngDimensions(buffer: Buffer): { width: number, height: number } | null {
    // PNG signature: 137 80 78 71 13 10 26 10
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47)
        return null
    // Width at bytes 16-19, height at bytes 20-23 (big-endian)
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height }
}

async function validateImageAsset(asset: ImageAsset, label: string, issues: string[]): Promise<boolean> {
    const fullPath = resolve(asset.path)
    const buffer = await readFile(fullPath)
    const dims = getPngDimensions(buffer)
    if (!dims) {
        issues.push(`${label}: not a valid PNG file — ${asset.path}`)
        return false
    }

    if (dims.width !== asset.width || dims.height !== asset.height) {
        issues.push(`${label}: expected ${asset.width}×${asset.height} but got ${dims.width}×${dims.height} — ${asset.path}`)
        return false
    }

    if (!existsSync(fullPath)) {
        issues.push(`${label}: file not found — ${asset.path}`)
        return false
    }

    if (!asset.path.endsWith('.png')) {
        issues.push(`${label}: expected .png format — ${asset.path}`)
        return false
    }

    return true
}

export async function validatePublishDetails(manifest: Browser.runtime.Manifest): Promise<string[]> {
    const issues: string[] = []

    const { screenshots, largePromoTile } = details.common
    for (const [i, screenshot] of screenshots.entries()) {
        await validateImageAsset(screenshot, `screenshots[${i}]`, issues)
    }

    if (screenshots.length > 5) {
        issues.push(`Max 5 screenshots allowed, got ${screenshots.length}`)
    }

    await validateImageAsset(details.chrome.icon, 'chrome.icon', issues)
    await validateImageAsset(details.edge.icon, 'edge.icon', issues)
    await validateImageAsset(details.common.smallPromoTile, 'smallPromoTile', issues)
    if (largePromoTile) {
        await validateImageAsset(largePromoTile, 'largePromoTile', issues)
    }
    const { searchTerms } = details.edge
    if (searchTerms.length > 7)
        issues.push(`Edge search terms: max 7 terms, got ${searchTerms.length}`)
    for (const term of searchTerms) {
        if (term.length > 30)
            issues.push(`Edge search term "${term}" exceeds 30 char limit (${term.length})`)
    }
    const totalWords = searchTerms.reduce((sum, term) => sum + term.split(pattern).length, 0)
    if (totalWords > 21)
        issues.push(`Edge search terms: max 21 words total, got ${totalWords}`)

    const manifestPermissions = manifest.permissions ?? []
    const justified = Object.keys(details.chrome.permissionJustifications)
    for (const perm of manifestPermissions) {
        if (!justified.includes(perm))
            issues.push(`Permission "${perm}" in manifest but missing justification in details`)
    }
    for (const perm of justified) {
        if (!manifestPermissions.includes(perm))
            issues.push(`Justification for "${perm}" but not in manifest permissions`)
    }

    const lines: string[] = [
        '=== Common ===',
        '',
        'Description:',
        details.common.description,
        'Privacy Policy URL:',
        details.common.privacyPolicyUrl,
        '',
        'Website URL:',
        details.common.websiteUrl,
        '',
        'Mature Content:',
        `${details.common.matureContent}`,
        '',
        '=== Chrome ===',
        '',
        'Category:',
        details.chrome.category,
        '',
        'Official URL:',
        details.chrome.officialUrl ?? '(none)',
        '',
        'Support URL:',
        details.chrome.supportUrl,
        '',
        'Single Purpose:',
        details.chrome.singlePurpose,
        '',
        'Remote Code:',
        `${details.chrome.remoteCode}`,
        '',
        'Host Permission Justification:',
        details.chrome.hostPermissionJustification,
        '',
        'Permission Justifications:',
        ...Object.entries(details.chrome.permissionJustifications).flatMap(([k, v]) => [`  ${k}:`, `  ${v}`, '']),
        '=== Edge ===',
        '',
        'Category:',
        details.edge.category,
        '',
        'Search Terms:',
        ...details.edge.searchTerms,
        '',
        'Support Contact:',
        details.edge.supportContact,
        '',
        'Collects Personal Data:',
        `${details.edge.collectsPersonalData}`,
    ]

    await writeFile(resolve('publish/assets/details.txt'), lines.join('\n'), 'utf-8')

    return issues
}
