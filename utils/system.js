export function generateRandomId(length = 26) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
}

function generateRandomCpuInfo() {
    const cpuModels = [
        "AMD Ryzen 5 5600G with Radeon Graphics",
        "Intel Core i7-9700K",
        "AMD Ryzen 7 5800X",
        "Intel Core i9-10900K",
        "Intel Core i5-11600K",
        "AMD Ryzen 9 5900X",
        "Intel Core i7-12700K",
        "AMD Ryzen 5 3600X",
        "Intel Core i9-11900K",
        "AMD Ryzen 3 3200G"
    ];

    const features = ["mmx", "sse", "sse2", "sse3", "ssse3", "sse4_1", "sse4_2", "avx"];
    const numOfProcessors = [4, 8, 16, 32][Math.floor(Math.random() * 4)];

    let processors = [];
    for (let i = 0; i < numOfProcessors; i++) {
        processors.push({
            usage: {
                idle: Math.floor(Math.random() * 2000000000000),
                kernel: Math.floor(Math.random() * 10000000000),
                total: Math.floor(Math.random() * 2000000000000),
                user: Math.floor(Math.random() * 50000000000)
            }
        });
    }

    return {
        archName: "x86_64",
        features: features,
        modelName: cpuModels[Math.floor(Math.random() * cpuModels.length)],
        numOfProcessors: numOfProcessors,
        processors: processors,
        temperatures: []
    };
}

function generateRandomGpuInfo() {
    const renderers = [
        "ANGLE (AMD, AMD Radeon(TM) Graphics (0x00001638) Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (Intel, Iris Xe Graphics (0x00008086) Direct3D11 vs_5_0 ps_5_0, D3D11)"
    ];
    const vendors = ["Google Inc. (AMD)", "NVIDIA", "Intel"];
    return {
        renderer: renderers[Math.floor(Math.random() * renderers.length)],
        vendor: vendors[Math.floor(Math.random() * vendors.length)]
    };
}

function generateRandomOperatingSystem() {
    const osList = ["windows", "linux", "macOS"];
    return osList[Math.floor(Math.random() * osList.length)];
}

export function generateRandomSystemData() {
    return {
        id: generateRandomId(26),
        type: "system",
        data: {
            gpuInfo: generateRandomGpuInfo(),
            memoryInfo: {
                availableCapacity: Math.floor(Math.random() * 1000000000) + 1000000000,
                capacity: Math.floor(Math.random() * 1000000000) + 2000000000
            },
            operatingSystem: generateRandomOperatingSystem(),
            machineId: generateRandomId(32).toLowerCase(),
            cpuInfo: generateRandomCpuInfo()
        }
    };
}
