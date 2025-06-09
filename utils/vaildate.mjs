import fs from 'fs';

export async function VPCIdExists(vpcId) {
    const filePath = `data/vpc/${vpcId}.vpc.toml`;
    try {
        await fs.promises.access(filePath);
        return true; // File exists
    }
    catch (err) {
        return false; // File does not exist
    }
}

export async function routerIdExists(routerId) {
    const filePath = `data/routers/${routerId}.router.toml`;
    try {
        await fs.promises.access(filePath);
        return true; // File exists
    }
    catch (err) {
        return false; // File does not exist
    }
}

export async function subnetIdExists(subnetId) {
    const filePath = `data/subnets/${subnetId}.subnet.toml`;
    try {
        await fs.promises.access(filePath);
        return true; // File exists
    }
    catch (err) {
        return false; // File does not exist
    }
}