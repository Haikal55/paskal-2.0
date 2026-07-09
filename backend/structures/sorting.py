def bubble_sort(arr, key, reverse=False):
    """
    Bubble Sort: Mengurutkan list of dicts secara in-place (atau salinan).
    Waktu: O(N^2)
    """
    n = len(arr)

    data = list(arr)

    for i in range(n):
        swapped = False
        for j in range(0, n-i-1):
            val1 = data[j].get(key)
            val2 = data[j+1].get(key)


            if val1 is None: val1 = 0
            if val2 is None: val2 = 0


            if (not reverse and val1 > val2) or (reverse and val1 < val2):
                data[j], data[j+1] = data[j+1], data[j]
                swapped = True
        if not swapped:
            break
    return data


def merge_sort(arr, key, reverse=False):
    """
    Merge Sort: Mengurutkan list of dicts menggunakan pendekatan divide and conquer.
    Waktu: O(N log N)
    """
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid], key, reverse)
    right = merge_sort(arr[mid:], key, reverse)

    return _merge(left, right, key, reverse)


def _merge(left, right, key, reverse):
    result = []
    i = j = 0

    while i < len(left) and j < len(right):
        val1 = left[i].get(key)
        val2 = right[j].get(key)

        if val1 is None: val1 = 0
        if val2 is None: val2 = 0

        if not reverse:
            if val1 <= val2:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        else:
            if val1 >= val2:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1

    result.extend(left[i:])
    result.extend(right[j:])
    return result


def quick_sort(arr, key, reverse=False):
    """
    Quick Sort: Mengurutkan list of dicts menggunakan pivot.
    Waktu: O(N log N) rata-rata
    """
    if len(arr) <= 1:
        return arr

    pivot = arr[0]
    pivot_val = pivot.get(key)
    if pivot_val is None: pivot_val = 0

    left = []
    right = []
    middle = []

    for item in arr:
        val = item.get(key)
        if val is None: val = 0

        if val == pivot_val:
            middle.append(item)
        elif not reverse:
            if val < pivot_val:
                left.append(item)
            else:
                right.append(item)
        else:
            if val > pivot_val:
                left.append(item)
            else:
                right.append(item)

    return quick_sort(left, key, reverse) + middle + quick_sort(right, key, reverse)
