export default function sources(): string[] {
    var list: string[] = [];
    for (let t = 1; t <= 409; t++) {
        let id = t.toString();
        while (id.length < 5) id = "0" + id;
        list.push(`/images/image${id}.jpg`);
    }
    return list;
}