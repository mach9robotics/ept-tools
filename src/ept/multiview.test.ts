import type { Bounds } from "./bounds"
import { MultiView } from "./multiview"
import type { View } from "./view"

function viewFromPoints(points: [number, number, number][]): View.Readable {
    return {
        schema: [],
        length: points.length,
        getter: (field: string) => (i: number) => {
            const idx = {X: 0, Y: 1, Z: 2}[field]
            return points[i][idx || 0]
        }
    }
}

const schema = [
    {name: "X", type: "unsigned", size: 4},
    {name: "Y", type: "float", size: 4},
    {name: "Z", type: "signed", size: 8},
]

test('create', () => {
    const parentView = viewFromPoints([
        [0, 0, 0],
        [1, 1, 1],
        [3, 3, 3]
    ])

    const childView = viewFromPoints([
        [0.5, 0.5, 0.5]
    ])
    
    const childBounds: Bounds = [0.1, 0.1, 0.1, 1.1, 1.1, 1.1]

    const multiView = new MultiView([parentView, childView], childBounds, [])

    expect(multiView.length).toBe(2)
    expect(multiView.schema).toEqual([])

    const points = Array(multiView.length).fill(0).map((_, i) => {
        return [multiView.getter('X')(i), multiView.getter('Y')(i), multiView.getter('Z')(i)]
    })

    expect(points).toContainEqual([0.5, 0.5, 0.5])
    expect(points).toContainEqual([1, 1, 1])
})

test('empty', () => {
    const parentView = viewFromPoints([
        [0, 0, 0],
        [1, 1, 1],
        [3, 3, 3]
    ])

    const bounds: Bounds = [4, 4, 4, 5, 5, 5]
    const multiView = new MultiView([parentView], bounds, [])

    expect(multiView.length).toBe(1)
    expect(multiView.schema).toEqual([])
    const points = Array(multiView.length).fill(0).map((_, i) => {
        return [multiView.getter('X')(i), multiView.getter('Y')(i), multiView.getter('Z')(i)]
    })
    expect(points).toContainEqual([0, 0, 0])
})