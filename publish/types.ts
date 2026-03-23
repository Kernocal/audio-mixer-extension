export type ChromeCategory
    // Productivity
    = | 'Communication'
        | 'Developer Tools'
        | 'Education'
        | 'Tools'
        | 'Workflow & Planning'
    // Lifestyle
        | 'Art & Design'
        | 'Entertainment'
        | 'Games'
        | 'Household'
        | 'Just for Fun'
        | 'News & Weather'
        | 'Shopping'
        | 'Social Networking'
        | 'Travel'
        | 'Well-being'
    // Make Chrome Yours
        | 'Accessibility'
        | 'Functionality & UI'
        | 'Privacy & Security'

export type EdgeCategory
    = | 'Accessibility'
        | 'Blogging'
        | 'Communication'
        | 'Developer tools'
        | 'Entertainment'
        | 'News & weather'
        | 'Photos'
        | 'Productivity'
        | 'Search tools'
        | 'Shopping'
        | 'Social'
        | 'Sports'

export interface ImageAsset<W extends number = number, H extends number = number> {
    path: string
    width: W
    height: H
}

type Screenshot = ImageAsset<1280, 800> | ImageAsset<640, 400>

export interface CommonDetails {
    description: string
    privacyPolicyUrl: string
    screenshots: [Screenshot, ...Screenshot[]]
    smallPromoTile: ImageAsset<440, 280> | null
    largePromoTile: ImageAsset<1400, 560> | null
    promoVideoUrl: string | null
    websiteUrl: string
    matureContent: boolean
}

export interface ChromeDetails {
    category: ChromeCategory
    icon: ImageAsset<128, 128>
    officialUrl: string | null
    supportUrl: string
    singlePurpose: string
    permissionJustifications: Record<string, string>
    hostPermissionJustification: string
    remoteCode: boolean
}

export interface EdgeDetails {
    category: EdgeCategory
    icon: ImageAsset<300, 300>
    searchTerms: string[]
    supportContact: string
    collectsPersonalData: boolean
}

export interface PublishDetails {
    common: CommonDetails
    chrome: ChromeDetails
    edge: EdgeDetails
}
