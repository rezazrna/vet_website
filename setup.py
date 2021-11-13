# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in vet_website/__init__.py
from vet_website import __version__ as version

setup(
	name='vet_website',
	version=version,
	description='Vet Website',
	author='bikbuk',
	author_email='admin@bikbuk.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
