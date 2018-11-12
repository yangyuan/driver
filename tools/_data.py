def get_data_path():
    from os.path import abspath, join, dirname, realpath
    return abspath(join(dirname(realpath(__file__)), '..', 'data'))
